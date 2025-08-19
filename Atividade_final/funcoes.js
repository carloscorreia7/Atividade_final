// Sistema Híbrido - Carrinho Offline + Backend para Usuários
// Estado global da aplicação
let usuarioLogado = false;
let dadosUsuario = null;
let carrinho = [];
let totalCarrinho = 0;

// Inicialização quando o documento estiver pronto
$(document).ready(function() {
    verificarStatusLogin();
    carregarCarrinho();
    inicializarEventos();
});

// Verificar se usuário está logado
function verificarStatusLogin() {
    $.ajax({
        url: '/verificar-login',
        method: 'GET',
        success: function(response) {
            if (response.logado) {
                usuarioLogado = true;
                dadosUsuario = response.usuario;
                carregarCarrinhoServidor();
            } else {
                usuarioLogado = false;
                dadosUsuario = null;
                carregarCarrinhoLocal();
            }
            atualizarInterfaceUsuario();
        },
        error: function() {
            // Se não conseguir conectar com servidor, usar modo offline
            usuarioLogado = false;
            dadosUsuario = null;
            carregarCarrinhoLocal();
            atualizarInterfaceUsuario();
        }
    });
}

// Carregar carrinho do localStorage (modo offline)
function carregarCarrinhoLocal() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
    calcularTotalCarrinho();
    atualizarContadorCarrinho();
}

// Carregar carrinho do servidor (quando logado)
function carregarCarrinhoServidor() {
    $.ajax({
        url: '/carrinho/listar',
        method: 'GET',
        success: function(response) {
            carrinho = response.carrinho || [];
            calcularTotalCarrinho();
            atualizarContadorCarrinho();
        },
        error: function() {
            console.log('Erro ao carregar carrinho do servidor');
            carregarCarrinhoLocal();
        }
    });
}

// Função genérica para carregar carrinho
function carregarCarrinho() {
    if (usuarioLogado) {
        carregarCarrinhoServidor();
    } else {
        carregarCarrinhoLocal();
    }
}

// Salvar dados no localStorage
function salvarDadosLocais() {
    localStorage.setItem('calmaair_carrinho', JSON.stringify(carrinhoOffline));
    if (usuarioOffline) {
        localStorage.setItem('calmaair_usuario', JSON.stringify(usuarioOffline));
    }
}

// Inicializar eventos offline
function inicializarEventosOffline() {
    // Eventos dos modais
    $('#login-btn').off('click').on('click', function() {
        if (usuarioOffline) {
            if (confirm('Deseja fazer logout?')) {
                logoutOffline();
            }
        } else {
            $('#login-modal').addClass('show');
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
            mostrarNotificacaoOffline('Preencha todos os campos', 'error');
            return;
        }

        if (!validarEmailOffline(email)) {
            mostrarNotificacaoOffline('Digite um e-mail válido', 'error');
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
            mostrarNotificacaoOffline('Preencha todos os campos', 'error');
            return;
        }

        if (!validarEmailOffline(email)) {
            mostrarNotificacaoOffline('Digite um e-mail válido', 'error');
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarNotificacaoOffline('As senhas não coincidem', 'error');
            return;
        }

        if (senha.length < 6) {
            mostrarNotificacaoOffline('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        cadastrarOffline({ nome, dataNascimento, cpf, telefone, email, senha });
    });

    // Botões de adicionar ao carrinho
    $(document).off('click', '.add-to-cart').on('click', '.add-to-cart', function() {
        const produto = {
            produto_id: $(this).data('id'),
            nome: $(this).data('nome'),
            preco: parseFloat($(this).data('preco')),
            quantidade: 1,
            imagem: $(this).data('imagem')
        };

        adicionarAoCarrinhoOffline(produto);
    });

    // Botão do carrinho
    $('#cart-btn').off('click').on('click', function() {
        mostrarCarrinhoOffline();
    });
}

// Login offline (simulado)
function loginOffline(email, senha) {
    // Simular validação (em um sistema real, seria no servidor)
    const usuariosSimulados = JSON.parse(localStorage.getItem('calmaair_usuarios') || '[]');
    const usuario = usuariosSimulados.find(u => u.email === email && u.senha === senha);

    if (usuario) {
        usuarioOffline = {
            nome: usuario.nome,
            email: usuario.email
        };
        salvarDadosLocais();
        $('#login-modal').removeClass('show');
        mostrarNotificacaoOffline('Login realizado com sucesso!', 'success');
        atualizarInterfaceOffline();
    } else {
        mostrarNotificacaoOffline('Email ou senha incorretos', 'error');
    }
}

// Cadastro offline
function cadastrarOffline(dados) {
    const usuariosSimulados = JSON.parse(localStorage.getItem('calmaair_usuarios') || '[]');
    
    // Verificar se email já existe
    if (usuariosSimulados.find(u => u.email === dados.email)) {
        mostrarNotificacaoOffline('E-mail já cadastrado', 'error');
        return;
    }

    // Adicionar novo usuário
    usuariosSimulados.push({
        nome: dados.nome,
        email: dados.email,
        senha: dados.senha,
        telefone: dados.telefone,
        dataNascimento: dados.dataNascimento,
        cpf: dados.cpf
    });

    localStorage.setItem('calmaair_usuarios', JSON.stringify(usuariosSimulados));
    
    $('#register-modal').removeClass('show');
    mostrarNotificacaoOffline('Cadastro realizado com sucesso! Agora você pode fazer login.', 'success');
    
    // Auto-login após cadastro
    setTimeout(() => {
        loginOffline(dados.email, dados.senha);
    }, 1000);
}

// Logout offline
function logoutOffline() {
    usuarioOffline = null;
    carrinhoOffline = [];
    localStorage.removeItem('calmaair_usuario');
    localStorage.removeItem('calmaair_carrinho');
    atualizarInterfaceOffline();
    atualizarContadorOffline();
    mostrarNotificacaoOffline('Logout realizado com sucesso!', 'success');
}

// Atualizar interface baseada no login
function atualizarInterfaceOffline() {
    if (usuarioOffline) {
        $('#login-btn .btn-text').text(`Olá, ${usuarioOffline.nome.split(' ')[0]}`);
        $('#register-btn').hide();
        $('#cart-counter').show();
    } else {
        $('#login-btn .btn-text').text('Minha Conta');
        $('#register-btn').show();
        $('#cart-counter').hide();
    }
}

// Adicionar produto ao carrinho offline
function adicionarAoCarrinhoOffline(produto) {
    const itemExistente = carrinhoOffline.find(item => item.produto_id === produto.produto_id);

    if (itemExistente) {
        itemExistente.quantidade += produto.quantidade;
        mostrarNotificacaoOffline('Quantidade atualizada no carrinho', 'success');
    } else {
        carrinhoOffline.push(produto);
        mostrarNotificacaoOffline('Produto adicionado ao carrinho', 'success');
    }

    salvarDadosLocais();
    calcularTotalOffline();
    atualizarContadorOffline();
}

// Atualizar quantidade no carrinho
function atualizarQuantidadeOffline(produtoId, quantidade) {
    const item = carrinhoOffline.find(item => item.produto_id === produtoId);
    if (item) {
        if (quantidade <= 0) {
            removerDoCarrinhoOffline(produtoId);
        } else {
            item.quantidade = quantidade;
            salvarDadosLocais();
            calcularTotalOffline();
            atualizarContadorOffline();
            mostrarNotificacaoOffline('Carrinho atualizado', 'success');
            // Recarregar modal do carrinho
            $('#cart-modal').remove();
            mostrarCarrinhoOffline();
        }
    }
}

// Remover produto do carrinho
function removerDoCarrinhoOffline(produtoId) {
    carrinhoOffline = carrinhoOffline.filter(item => item.produto_id !== produtoId);
    salvarDadosLocais();
    calcularTotalOffline();
    atualizarContadorOffline();
    mostrarNotificacaoOffline('Produto removido do carrinho', 'success');
    
    // Recarregar modal do carrinho
    $('#cart-modal').remove();
    if (carrinhoOffline.length > 0) {
        mostrarCarrinhoOffline();
    }
}

// Limpar carrinho
function limparCarrinhoOffline() {
    carrinhoOffline = [];
    localStorage.removeItem('calmaair_carrinho');
    calcularTotalOffline();
    atualizarContadorOffline();
    mostrarNotificacaoOffline('Carrinho limpo', 'success');
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
function mostrarCarrinhoOffline() {
    if (carrinhoOffline.length === 0) {
        mostrarNotificacaoOffline('Seu carrinho está vazio', 'info');
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
                <img src="${item.imagem || 'placeholder.jpg'}" alt="${item.nome}">
                <div class="item-details">
                    <h4>${item.nome}</h4>
                    <p class="item-price">R$ ${item.preco.toFixed(2)}</p>
                </div>
                <div class="quantity-controls">
                    <button onclick="atualizarQuantidadeOffline(${item.produto_id}, ${item.quantidade - 1})" ${item.quantidade <= 1 ? 'disabled' : ''}>-</button>
                    <span>${item.quantidade}</span>
                    <button onclick="atualizarQuantidadeOffline(${item.produto_id}, ${item.quantidade + 1})">+</button>
                </div>
                <div class="item-total">R$ ${(item.preco * item.quantidade).toFixed(2)}</div>
                <button class="remove-item" onclick="removerDoCarrinhoOffline(${item.produto_id})">🗑️</button>
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
                        <button class="btn-clear-cart" onclick="limparCarrinhoOffline()">Limpar Carrinho</button>
                        <button class="btn-checkout" onclick="mostrarCheckoutOffline()">Finalizar Compra</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('body').append(html);
}

// Mostrar checkout offline
function mostrarCheckoutOffline() {
    if (!usuarioOffline) {
        mostrarNotificacaoOffline('Faça login para finalizar a compra', 'error');
        $('#cart-modal').remove();
        $('#login-modal').addClass('show');
        return;
    }

    $('#cart-modal').remove();
    
    let html = `
        <div id="checkout-modal" class="modal-overlay show">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Finalizar Compra</h2>
                    <button class="close-modal" onclick="$('#checkout-modal').remove()">&times;</button>
                </div>
                <form id="checkout-form-offline" class="modal-form">
                    <div class="input-group">
                        <label>Endereço de Entrega:</label>
                        <textarea id="checkout-endereco-offline" placeholder="Digite seu endereço completo" required></textarea>
                    </div>
                    <div class="input-group">
                        <label>Forma de Pagamento:</label>
                        <select id="checkout-pagamento-offline" required>
                            <option value="">Selecione...</option>
                            <option value="cartao_credito">Cartão de Crédito</option>
                            <option value="cartao_debito">Cartão de Débito</option>
                            <option value="pix">PIX</option>
                            <option value="boleto">Boleto</option>
                        </select>
                    </div>
                    <div class="checkout-summary">
                        <h3>Resumo do Pedido:</h3>
                        <div class="summary-items">
    `;

    carrinhoOffline.forEach(item => {
        html += `
            <div class="summary-item">
                <span>${item.nome} x${item.quantidade}</span>
                <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
        `;
    });

    html += `
                        </div>
                        <div class="summary-total">Total: R$ ${totalCarrinhoOffline.toFixed(2)}</div>
                    </div>
                    <button type="submit" class="btn-submit">Confirmar Pedido</button>
                </form>
            </div>
        </div>
    `;

    $('body').append(html);

    $('#checkout-form-offline').on('submit', function(e) {
        e.preventDefault();
        finalizarCompraOffline();
    });
}

// Finalizar compra offline
function finalizarCompraOffline() {
    const endereco = $('#checkout-endereco-offline').val();
    const formaPagamento = $('#checkout-pagamento-offline').val();

    if (!endereco || !formaPagamento) {
        mostrarNotificacaoOffline('Preencha todos os campos', 'error');
        return;
    }

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
    const pedidos = JSON.parse(localStorage.getItem('calmaair_pedidos') || '[]');
    pedidos.push(pedido);
    localStorage.setItem('calmaair_pedidos', JSON.stringify(pedidos));

    // Limpar carrinho
    carrinhoOffline = [];
    localStorage.removeItem('calmaair_carrinho');
    calcularTotalOffline();
    atualizarContadorOffline();

    $('#checkout-modal').remove();
    mostrarNotificacaoOffline(`Pedido #${pedido.id} confirmado com sucesso!`, 'success');
}

// Funções auxiliares
function validarEmailOffline(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function mostrarNotificacaoOffline(mensagem, tipo) {
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

// Expor funções globalmente para uso nos botões HTML
window.atualizarQuantidadeOffline = atualizarQuantidadeOffline;
window.removerDoCarrinhoOffline = removerDoCarrinhoOffline;
window.limparCarrinhoOffline = limparCarrinhoOffline;
window.mostrarCheckoutOffline = mostrarCheckoutOffline;
