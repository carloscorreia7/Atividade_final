// Sistema de Carrinho Offline - Versão Original Recuperada
// Estado global do carrinho offline
let carrinhoOffline = [];
let usuarioOffline = null;
let totalCarrinhoOffline = 0;

// Inicialização quando o documento estiver pronto
$(document).ready(function() {
    verificarStatusLogin();
    carregarDadosOffline();
    inicializarEventosOffline();
    atualizarInterfaceOffline();
    configurarLazyLoading();
});

// Carregar dados do localStorage
function carregarDadosOffline() {
    // Carregar carrinho
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        carrinhoOffline = JSON.parse(carrinhoSalvo);
    }

    // Carregar usuário simulado
    const usuarioSalvo = localStorage.getItem('usuario_offline');
    if (usuarioSalvo) {
        usuarioOffline = JSON.parse(usuarioSalvo);
    }

    calcularTotalOffline();
    atualizarContadorOffline();
}

// Salvar dados no localStorage
function salvarDadosOffline() {
    localStorage.setItem('carrinho', JSON.stringify(carrinhoOffline));
    if (usuarioOffline) {
        localStorage.setItem('usuario_offline', JSON.stringify(usuarioOffline));
    }
}

// Inicializar eventos offline
function inicializarEventosOffline() {
    // Eventos dos modais
    $('#login-btn').off('click').on('click', function(e) {
        if (usuarioOffline) {
            e.preventDefault();
            const dropdown = $('#user-dropdown');
            if (dropdown.is(':visible')) {
                dropdown.hide();
            } else {
                dropdown.show();
            }
        } else {
            $('#login-modal').addClass('show');
        }
    });

    // Fechar dropdown ao clicar fora
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#login-btn, #user-dropdown').length) {
            $('#user-dropdown').hide();
        }
    });

    $('#register-btn').on('click', function() {
        $('#register-modal').addClass('show');
    });

    $('.close-modal').on('click', function() {
        const modal = $(this).data('modal');
        $(`#${modal}-modal`).removeClass('show');
    });

    // Fechar modal clicando fora
    $('.modal-overlay').on('click', function(e) {
        if (e.target === this) {
            $(this).removeClass('show');
        }
    });

    // Formulário de login offline
    $('#login-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        const email = $('#login-email').val();
        const senha = $('#login-password').val();

        if (!email || !senha) {
            mostrarNotificacao('Preencha todos os campos', 'error');
            return;
        }

        if (!validarEmail(email)) {
            mostrarNotificacao('Digite um e-mail válido', 'error');
            return;
        }

        loginOffline(email, senha);
    });

    // Formulário de cadastro offline
    $('#register-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        const nome = $('#register-name').val();
        const dataNascimento = $('#register-birth').val();
        const cpf = $('#register-cpf').val();
        const telefone = $('#register-phone').val();
        const email = $('#register-email').val();
        const senha = $('#register-password').val();
        const confirmarSenha = $('#register-confirm').val();

        if (!nome || !telefone || !email || !senha || !confirmarSenha) {
            mostrarNotificacao('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (!validarEmail(email)) {
            mostrarNotificacao('Digite um e-mail válido', 'error');
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarNotificacao('As senhas não coincidem', 'error');
            return;
        }

        if (senha.length < 6) {
            mostrarNotificacao('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        cadastrarOffline({ nome, dataNascimento, cpf, telefone, email, senha });
    });

    // Botões de adicionar ao carrinho
    $(document).off('click', '.add-to-cart').on('click', '.add-to-cart', function() {
        const id = $(this).data('id');
        const nome = $(this).data('nome');
        const preco = $(this).data('preco');
        const imagem = $(this).data('imagem');

        adicionarAoCarrinho(id, nome, preco, imagem);
    });

    // Botão do carrinho
    $('#cart-btn').off('click').on('click', function() {
        mostrarCarrinho();
    });
}

// Login com banco de dados
function loginOffline(email, senha) {
    $.ajax({
        url: '/logar',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, senha }),
        success: function(response) {
            if (response.msg === "Login bem-sucedido") {
                // Buscar dados do usuário após login
                $.ajax({
                    url: '/verificar-login',
                    method: 'GET',
                    success: function(userData) {
                        if (userData.logado) {
                            usuarioOffline = {
                                nome: userData.usuario.nome,
                                email: userData.usuario.email
                            };
                            salvarDadosOffline();
                            $('#login-modal').removeClass('show');
                            mostrarNotificacao('Login realizado com sucesso!', 'success');
                            atualizarInterfaceOffline();
                        }
                    }
                });
            } else {
                mostrarNotificacao(response.msg, 'error');
            }
        },
        error: function() {
            mostrarNotificacao('Erro ao conectar com servidor', 'error');
        }
    });
}

// Cadastro com banco de dados
function cadastrarOffline(dados) {
    $.ajax({
        url: '/cadastro',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            nome_completo: dados.nome,
            data_nascimento: dados.dataNascimento,
            cpf: dados.cpf,
            telefone: dados.telefone,
            email: dados.email,
            senha: dados.senha
        }),
        success: function(response) {
            $('#register-modal').removeClass('show');
            mostrarNotificacao(response.msg, 'success');
            
            // Mostrar modal de verificação de email
            mostrarModalVerificacao(dados.email);
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            mostrarNotificacao(response.msg || 'Erro ao cadastrar usuário', 'error');
        }
    });
}

// Logout com servidor
function logoutOffline() {
    $.ajax({
        url: '/logout',
        method: 'GET',
        success: function() {
            usuarioOffline = null;
            localStorage.removeItem('usuario_offline');
            atualizarInterfaceOffline();
            mostrarNotificacao('Logout realizado com sucesso!', 'success');
        },
        error: function() {
            // Mesmo se der erro no servidor, fazer logout local
            usuarioOffline = null;
            localStorage.removeItem('usuario_offline');
            atualizarInterfaceOffline();
            mostrarNotificacao('Logout realizado!', 'success');
        }
    });
}

// Atualizar interface baseada no login
function atualizarInterfaceOffline() {
    if (usuarioOffline) {
        $('#login-btn .btn-text').text(`Olá, ${usuarioOffline.nome.split(' ')[0]}`);
        $('#register-btn').hide();
        $('#cart-counter').show();
        
        // Adicionar dropdown de logout se não existir
        if (!$('#user-dropdown').length) {
            const dropdown = `
                <div id="user-dropdown" class="user-dropdown" style="display: none;">
                    <div class="dropdown-item" onclick="logoutOffline()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </div>
                </div>
            `;
            $('#login-btn').parent().append(dropdown);
        }
    } else {
        $('#login-btn .btn-text').text('Minha Conta');
        $('#register-btn').show();
        $('#user-dropdown').remove();
        if (carrinhoOffline.length === 0) {
            $('#cart-counter').hide();
        }
    }
}

// Adicionar produto ao carrinho offline
function adicionarAoCarrinho(id, nome, preco, imagem) {
    let produtoExistente = carrinhoOffline.find(item => item.produto_id == id);

    if (produtoExistente) {
        produtoExistente.quantidade += 1;
    } else {
        carrinhoOffline.push({
            produto_id: id,
            nome: nome,
            preco: parseFloat(preco),
            imagem: imagem,
            quantidade: 1
        });
    }

    salvarDadosOffline();
    calcularTotalOffline();
    atualizarContadorOffline();

    mostrarNotificacao(`${nome} adicionado ao carrinho!`, 'success');
}

// Atualizar quantidade no carrinho
function atualizarQuantidade(produtoId, quantidade) {
    const item = carrinhoOffline.find(item => item.produto_id == produtoId);
    if (item) {
        if (quantidade <= 0) {
            removerDoCarrinho(produtoId);
        } else {
            item.quantidade = quantidade;
            salvarDadosOffline();
            calcularTotalOffline();
            atualizarContadorOffline();
            mostrarNotificacao('Carrinho atualizado', 'success');
            // Recarregar modal do carrinho se estiver aberto
            if ($('#cart-modal').length > 0) {
                $('#cart-modal').remove();
                mostrarCarrinho();
            }
        }
    }
}

// Remover produto do carrinho
function removerDoCarrinho(produtoId) {
    carrinhoOffline = carrinhoOffline.filter(item => item.produto_id != produtoId);
    salvarDadosOffline();
    calcularTotalOffline();
    atualizarContadorOffline();
    mostrarNotificacao('Produto removido do carrinho', 'success');
    
    // Recarregar modal do carrinho se estiver aberto
    if ($('#cart-modal').length > 0) {
        $('#cart-modal').remove();
        if (carrinhoOffline.length > 0) {
            mostrarCarrinho();
        }
    }
}

// Limpar carrinho
function limparCarrinho() {
    carrinhoOffline = [];
    localStorage.removeItem('carrinho');
    calcularTotalOffline();
    atualizarContadorOffline();
    mostrarNotificacao('Carrinho limpo', 'success');
    $('#cart-modal').remove();
}

// Atualizar contador do carrinho
function atualizarContadorOffline() {
    const totalItens = carrinhoOffline.reduce((total, item) => total + item.quantidade, 0);
    $('#cart-counter').text(totalItens);
    
    if (totalItens > 0) {
        $('#cart-counter').show();
    } else {
        $('#cart-counter').hide();
    }
}

// Calcular total do carrinho
function calcularTotalOffline() {
    totalCarrinhoOffline = carrinhoOffline.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

// Mostrar carrinho offline
function mostrarCarrinho() {
    if (carrinhoOffline.length === 0) {
        mostrarNotificacao('Seu carrinho está vazio', 'info');
        return;
    }

    let html = `
        <div id="cart-modal" class="modal-overlay show">
            <div class="modal-container cart-container">
                <div class="modal-header">
                    <h2>Meu Carrinho</h2>
                    <button class="close-modal" onclick="$('#cart-modal').remove()">&times;</button>
                </div>
                <div class="cart-items">
    `;

    carrinhoOffline.forEach(item => {
        html += `
            <div class="cart-item">
                <img src="${item.imagem || 'placeholder.jpg'}" alt="${item.nome}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW08L3RleHQ+Cjwvc3ZnPg=='">
                <div class="item-details">
                    <h4>${item.nome}</h4>
                    <p class="item-price">R$ ${item.preco.toFixed(2)}</p>
                </div>
                <div class="quantity-controls">
                    <button onclick="atualizarQuantidade(${item.produto_id}, ${item.quantidade - 1})" ${item.quantidade <= 1 ? 'disabled' : ''}>-</button>
                    <span>${item.quantidade}</span>
                    <button onclick="atualizarQuantidade(${item.produto_id}, ${item.quantidade + 1})">+</button>
                </div>
                <div class="item-total">R$ ${(item.preco * item.quantidade).toFixed(2)}</div>
                <button class="remove-item" onclick="removerDoCarrinho(${item.produto_id})">🗑️</button>
            </div>
        `;
    });

    html += `
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <strong>Total: R$ ${totalCarrinhoOffline.toFixed(2)}</strong>
                    </div>
                    <div class="cart-actions">
                        <button class="btn-clear-cart" onclick="limparCarrinho()">Limpar Carrinho</button>
                        <button class="btn-checkout" onclick="mostrarCheckout()">Finalizar Compra</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('body').append(html);
}

// Mostrar checkout offline
function mostrarCheckout() {
    if (!usuarioOffline) {
        mostrarNotificacao('Faça login para finalizar a compra', 'error');
        $('#cart-modal').remove();
        $('#login-modal').addClass('show');
        return;
    }

    $('#cart-modal').remove();
    
    let html = `
        <div id="checkout-modal" class="modal-overlay show">
            <div class="modal-container checkout-modal">
                <div class="modal-header">
                    <h2><i class="fi fi-br-shopping-cart-check"></i> Finalizar Compra</h2>
                    <button class="close-modal" onclick="$('#checkout-modal').remove()">&times;</button>
                </div>
                <form id="checkout-form" class="checkout-form">
                    <div class="checkout-section">
                        <h3><i class="fi fi-br-marker"></i> Endereço de Entrega</h3>
                        <div class="input-group">
                            <textarea id="checkout-endereco" placeholder="Digite seu endereço completo com CEP, número e complemento" required></textarea>
                        </div>
                    </div>

                    <div class="checkout-section">
                        <h3><i class="fi fi-br-credit-card"></i> Forma de Pagamento</h3>
                        <div class="payment-options">
                            <div class="payment-option" data-value="cartao_credito">
                                <div class="payment-icon">
                                    <i class="fi fi-br-credit-card"></i>
                                </div>
                                <div class="payment-info">
                                    <h4>Cartão de Crédito</h4>
                                    <p>Visa, Mastercard, Elo</p>
                                </div>
                                <div class="payment-radio">
                                    <input type="radio" name="pagamento" value="cartao_credito" id="credito">
                                </div>
                            </div>

                            <div class="payment-option" data-value="cartao_debito">
                                <div class="payment-icon">
                                    <i class="fi fi-br-bank"></i>
                                </div>
                                <div class="payment-info">
                                    <h4>Cartão de Débito</h4>
                                    <p>Débito à vista</p>
                                </div>
                                <div class="payment-radio">
                                    <input type="radio" name="pagamento" value="cartao_debito" id="debito">
                                </div>
                            </div>

                            <div class="payment-option" data-value="pix">
                                <div class="payment-icon">
                                    <i class="fi fi-br-smartphone"></i>
                                </div>
                                <div class="payment-info">
                                    <h4>PIX</h4>
                                    <p>Pagamento instantâneo</p>
                                </div>
                                <div class="payment-radio">
                                    <input type="radio" name="pagamento" value="pix" id="pix">
                                </div>
                            </div>

                            <div class="payment-option" data-value="boleto">
                                <div class="payment-icon">
                                    <i class="fi fi-br-barcode"></i>
                                </div>
                                <div class="payment-info">
                                    <h4>Boleto Bancário</h4>
                                    <p>Vencimento em 3 dias</p>
                                </div>
                                <div class="payment-radio">
                                    <input type="radio" name="pagamento" value="boleto" id="boleto">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="checkout-summary">
                        <h3><i class="fi fi-br-list"></i> Resumo do Pedido</h3>
                        <div class="summary-items">
    `;

    carrinhoOffline.forEach(item => {
        html += `
            <div class="summary-item">
                <div class="item-info">
                    <img src="${item.imagem}" alt="${item.nome}" class="summary-image">
                    <div>
                        <span class="item-name">${item.nome}</span>
                        <span class="item-qty">Quantidade: ${item.quantidade}</span>
                    </div>
                </div>
                <span class="item-price">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
        `;
    });

    html += `
                        </div>
                        <div class="summary-total">
                            <div class="total-row">
                                <span>Subtotal:</span>
                                <span>R$ ${totalCarrinhoOffline.toFixed(2)}</span>
                            </div>
                            <div class="total-row">
                                <span>Frete:</span>
                                <span class="free-shipping">Grátis</span>
                            </div>
                            <div class="total-row final-total">
                                <span>Total:</span>
                                <span>R$ ${totalCarrinhoOffline.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn-checkout-confirm">
                        <i class="fi fi-br-check"></i>
                        Confirmar Pedido
                    </button>
                </form>
            </div>
        </div>
    `;

    $('body').append(html);

    // Eventos para seleção de pagamento
    $('.payment-option').on('click', function() {
        $('.payment-option').removeClass('selected');
        $(this).addClass('selected');
        $(this).find('input[type="radio"]').prop('checked', true);
    });

    $('#checkout-form').on('submit', function(e) {
        e.preventDefault();
        const endereco = $('#checkout-endereco').val();
        const formaPagamento = $('input[name="pagamento"]:checked').val();
        
        if (!endereco || !formaPagamento) {
            mostrarNotificacao('Preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        finalizarCompraComDados(endereco, formaPagamento);
    });
}

// Finalizar compra com dados
function finalizarCompraComDados(endereco, formaPagamento) {
    // Simular processamento do pedido
    const pedido = {
        id: Date.now(),
        usuario: usuarioOffline,
        itens: [...carrinhoOffline],
        total: totalCarrinhoOffline,
        endereco: endereco,
        formaPagamento: formaPagamento,
        data: new Date().toISOString(),
        status: 'Confirmado'
    };

    // Salvar pedido no localStorage
    const pedidos = JSON.parse(localStorage.getItem('pedidos_offline') || '[]');
    pedidos.push(pedido);
    localStorage.setItem('pedidos_offline', JSON.stringify(pedidos));

    // Limpar carrinho
    carrinhoOffline = [];
    localStorage.removeItem('carrinho');
    calcularTotalOffline();
    atualizarContadorOffline();

    $('#checkout-modal').remove();
    mostrarNotificacao(`Pedido #${pedido.id} confirmado com sucesso!`, 'success');
}

// Configurar lazy loading para imagens
function configurarLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Funções auxiliares
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function mostrarNotificacao(mensagem, tipo) {
    const classe = tipo === 'success' ? 'notification-success' : 
                   tipo === 'error' ? 'notification-error' : 'notification-info';
    
    const notification = $(`
        <div class="notification ${classe}">
            ${mensagem}
        </div>
    `);

    $('body').append(notification);
    
    setTimeout(() => {
        notification.addClass('show');
    }, 100);

    setTimeout(() => {
        notification.removeClass('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Modal de verificação de email
function mostrarModalVerificacao(email) {
    let html = `
        <div id="verification-modal" class="modal-overlay show">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Verificar E-mail</h2>
                    <button class="close-modal" onclick="$('#verification-modal').remove()">&times;</button>
                </div>
                <form id="verification-form" class="modal-form">
                    <p>Enviamos um código de verificação para <strong>${email}</strong></p>
                    <div class="input-group">
                        <label>Código de Verificação:</label>
                        <input type="text" id="verification-code" placeholder="Digite o código de 6 dígitos" required maxlength="6">
                    </div>
                    <button type="submit" class="btn-submit">Verificar</button>
                    <button type="button" class="btn-secondary" onclick="solicitarNovoCodigo('${email}')">Solicitar Novo Código</button>
                </form>
            </div>
        </div>
    `;

    $('body').append(html);

    $('#verification-form').on('submit', function(e) {
        e.preventDefault();
        const codigo = $('#verification-code').val();
        verificarEmail(email, codigo);
    });
}

// Verificar email
function verificarEmail(email, codigo) {
    $.ajax({
        url: '/verificar-email',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, codigo }),
        success: function(response) {
            if (response.msg === "E-mail verificado com sucesso!") {
                $('#verification-modal').remove();
                mostrarNotificacao(response.msg, 'success');
                // Auto-login após verificação
                setTimeout(() => {
                    $('#login-modal').addClass('show');
                }, 1000);
            } else {
                mostrarNotificacao(response.msg, 'error');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            mostrarNotificacao(response.msg || 'Erro ao verificar email', 'error');
        }
    });
}

// Solicitar novo código
function solicitarNovoCodigo(email) {
    $.ajax({
        url: '/novo-codigo',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email }),
        success: function(response) {
            mostrarNotificacao(response.msg, 'success');
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            mostrarNotificacao(response.msg || 'Erro ao solicitar novo código', 'error');
        }
    });
}

// Verificar status do login ao carregar página
function verificarStatusLogin() {
    $.ajax({
        url: '/verificar-login',
        method: 'GET',
        success: function(response) {
            if (response.logado) {
                usuarioOffline = {
                    nome: response.usuario.nome,
                    email: response.usuario.email
                };
                salvarDadosOffline();
                atualizarInterfaceOffline();
            }
        },
        error: function() {
            // Servidor offline - continuar com dados locais
            console.log('Servidor offline, usando dados locais');
        }
    });
}

// Remover inicialização duplicada - já existe no início do arquivo

// Expor funções globalmente para uso nos botões HTML
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.atualizarQuantidade = atualizarQuantidade;
window.removerDoCarrinho = removerDoCarrinho;
window.limparCarrinho = limparCarrinho;
window.mostrarCarrinho = mostrarCarrinho;
window.mostrarCheckout = mostrarCheckout;
window.solicitarNovoCodigo = solicitarNovoCodigo;
