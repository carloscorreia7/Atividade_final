// Produtos de ventiladores sem hélice
const produtos = [
    {
        id: 1,
        nome: "Ventilador Sem Hélice Torre Premium",
        preco: 899.90,
        parcelas: "12x R$ 74,99",
        imagem: "ChatGPT Image 16 de ago. de 2025, 16_59_43.png",
        descricao: "Ventilador de torre sem hélice com tecnologia de multiplicação de ar, 10 velocidades e controle remoto"
    },
    {
        id: 2,
        nome: "Ventilador Sem Hélice Portátil USB",
        preco: 299.90,
        parcelas: "12x R$ 24,99",
        imagem: "Gemini_Generated_Image_4gfa374gfa374gfa.jpeg",
        descricao: "Ventilador portátil sem hélice, recarregável via USB, silencioso e com 3 velocidades"
    },
    {
        id: 3,
        nome: "Ventilador Sem Hélice de Mesa Inteligente",
        preco: 599.90,
        parcelas: "12x R$ 49,99",
        imagem: "Captura de tela 2025-08-16 213811.png",
        descricao: "Ventilador de mesa sem hélice com controle por app, timer e função purificador de ar"
    },
    {
        id: 4,
        nome: "Ventilador Sem Hélice Compacto",
        preco: 199.90,
        parcelas: "12x R$ 16,66",
        imagem: "imagem_topo.png",
        descricao: "Ventilador compacto sem hélice, ideal para escritório, com design moderno e 5 velocidades"
    },
    {
        id: 5,
        nome: "Ventilador Sem Hélice Torre Pro",
        preco: 1299.90,
        parcelas: "12x R$ 108,33",
        imagem: "ChatGPT Image 16 de ago. de 2025, 16_59_43.png",
        descricao: "Ventilador de torre profissional sem hélice, com aquecimento, resfriamento e purificação do ar"
    },
    {
        id: 6,
        nome: "Ventilador Sem Hélice Mini",
        preco: 149.90,
        parcelas: "12x R$ 12,49",
        imagem: "Gemini_Generated_Image_4gfa374gfa374gfa.jpeg",
        descricao: "Mini ventilador sem hélice para uso pessoal, bateria de longa duração e ultra silencioso"
    }
];

// Variáveis globais
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let usuarioLogado = JSON.parse(localStorage.getItem('usuario')) || null;

// Inicialização
$(document).ready(function() {
    carregarProdutos();
    atualizarContadorCarrinho();
    verificarUsuarioLogado();
    configurarEventos();
});

// Carregar produtos na página
function carregarProdutos() {
    const grid = $('#products-grid');
    grid.empty();
    
    produtos.forEach(produto => {
        const produtoHTML = `
            <div class="product-card" data-id="${produto.id}">
                <img src="${produto.imagem}" alt="${produto.nome}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${produto.nome}</h3>
                    <div class="product-price">
                        <span class="price-main">R$ ${produto.preco.toFixed(2).replace('.', ',')}</span>
                        <span class="price-installments">${produto.parcelas}</span>
                    </div>
                    <button class="btn-add-cart" onclick="adicionarAoCarrinho(${produto.id})">
                        <i class="fi fi-br-shopping-cart"></i>
                        Adicionar ao Carrinho
                    </button>
                </div>
            </div>
        `;
        grid.append(produtoHTML);
    });
}

// Sistema de Carrinho
function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            ...produto,
            quantidade: 1
        });
    }
    
    salvarCarrinho();
    atualizarContadorCarrinho();
    atualizarCarrinho();
    mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`, 'success');
}

function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    salvarCarrinho();
    atualizarContadorCarrinho();
    atualizarCarrinho();
}

function alterarQuantidade(produtoId, novaQuantidade) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        if (novaQuantidade <= 0) {
            removerDoCarrinho(produtoId);
        } else {
            item.quantidade = novaQuantidade;
            salvarCarrinho();
            atualizarContadorCarrinho();
            atualizarCarrinho();
        }
    }
}

function calcularTotal() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function atualizarContadorCarrinho() {
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    const contador = $('#cart-counter');
    
    contador.text(totalItens);
    if (totalItens > 0) {
        contador.addClass('show');
    } else {
        contador.removeClass('show');
    }
}

function atualizarCarrinho() {
    const carrinhoItens = $('#cart-items');
    const carrinhoTotal = $('#cart-total');
    
    carrinhoItens.empty();
    
    if (carrinho.length === 0) {
        carrinhoItens.html('<p class="cart-empty">Seu carrinho está vazio</p>');
        carrinhoTotal.text('R$ 0,00');
        return;
    }
    
    carrinho.forEach(item => {
        const itemHTML = `
            <div class="cart-item">
                <img src="${item.imagem}" alt="${item.nome}" class="cart-item-image">
                <div class="cart-item-info">
                    <h6 class="cart-item-title">${item.nome}</h6>
                    <p class="cart-item-price">R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
                    <div class="quantity-controls">
                        <button onclick="alterarQuantidade(${item.id}, ${item.quantidade - 1})" class="qty-btn">-</button>
                        <span class="quantity">${item.quantidade}</span>
                        <button onclick="alterarQuantidade(${item.id}, ${item.quantidade + 1})" class="qty-btn">+</button>
                    </div>
                </div>
                <button onclick="removerDoCarrinho(${item.id})" class="remove-item">
                    <i class="fi fi-br-trash"></i>
                </button>
            </div>
        `;
        carrinhoItens.append(itemHTML);
    });
    
    carrinhoTotal.text(`R$ ${calcularTotal().toFixed(2).replace('.', ',')}`);
}

// Sistema de Notificações
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notification = $('#notification');
    notification.removeClass('show error');
    
    if (tipo === 'error') {
        notification.addClass('error');
    }
    
    notification.text(mensagem);
    notification.addClass('show');
    
    setTimeout(() => {
        notification.removeClass('show');
    }, 3000);
}

// Sistema de Login/Cadastro
function verificarUsuarioLogado() {
    if (usuarioLogado) {
        $('#login-btn .btn-text').text(`Olá, ${usuarioLogado.nome.split(' ')[0]}`);
        $('#login-btn').off('click').on('click', logout);
    }
}

function login(email, senha) {
    $.ajax({
        url: '/logar',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, senha }),
        success: function(response) {
            if (response.msg === "Login bem-sucedido") {
                usuarioLogado = response.usuario;
                localStorage.setItem('usuario', JSON.stringify(usuarioLogado));
                $('#login-modal').removeClass('show');
                verificarUsuarioLogado();
                mostrarNotificacao('Login realizado com sucesso!', 'success');
            } else {
                mostrarNotificacao(response.msg, 'error');
            }
        },
        error: function(xhr) {
            const erro = xhr.responseJSON?.msg || 'Erro ao fazer login';
            mostrarNotificacao(erro, 'error');
        }
    });
}

function cadastrar(dados) {
    // Ajustar dados para o formato esperado pelo servidor
    const dadosServidor = {
        nome_completo: dados.nome,
        data_nascimento: '1990-01-01', // Valor padrão, pode ser ajustado
        cpf: '000.000.000-00', // Valor padrão, pode ser ajustado
        telefone: dados.telefone,
        email: dados.email,
        senha: dados.senha
    };
    
    $.ajax({
        url: '/cadastro',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dadosServidor),
        success: function(response) {
            $('#register-modal').removeClass('show');
            mostrarNotificacao('Cadastro realizado! Verifique seu e-mail para confirmar.', 'success');
            // Mostrar modal de verificação
            mostrarModalVerificacao(dados.email);
        },
        error: function(xhr) {
            const erro = xhr.responseJSON?.msg || 'Erro ao cadastrar';
            mostrarNotificacao(erro, 'error');
        }
    });
}

function logout() {
    usuarioLogado = null;
    localStorage.removeItem('usuario');
    $('#login-btn .btn-text').text('Minha Conta');
    $('#login-btn').off('click').on('click', () => $('#login-modal').addClass('show'));
    mostrarNotificacao('Logout realizado com sucesso!', 'success');
}

// Finalizar compra
function finalizarCompra() {
    if (!usuarioLogado) {
        mostrarNotificacao('Faça login para finalizar a compra', 'error');
        $('#login-modal').addClass('show');
        return;
    }
    
    if (carrinho.length === 0) {
        mostrarNotificacao('Seu carrinho está vazio!', 'error');
        return;
    }
    
    const total = calcularTotal();
    const confirmacao = confirm(`Finalizar compra no valor de R$ ${total.toFixed(2).replace('.', ',')}?`);
    
    if (confirmacao) {
        // Aqui você pode enviar os dados da compra para o servidor
        const dadosCompra = {
            usuario: usuarioLogado.id,
            itens: carrinho,
            total: total,
            data: new Date().toISOString()
        };
        
        // Simular processamento da compra
        setTimeout(() => {
            carrinho = [];
            salvarCarrinho();
            atualizarContadorCarrinho();
            atualizarCarrinho();
            $('#cart-sidebar').removeClass('show');
            $('#cart-overlay').removeClass('show');
            mostrarNotificacao('Compra finalizada com sucesso! Você receberá um e-mail de confirmação.', 'success');
        }, 1000);
    }
}

// Configurar eventos
function configurarEventos() {
    // Eventos do carrinho
    $('#cart-btn').on('click', function() {
        $('#cart-sidebar').addClass('show');
        $('#cart-overlay').addClass('show');
        atualizarCarrinho();
    });
    
    $('.close-cart, #cart-overlay').on('click', function() {
        $('#cart-sidebar').removeClass('show');
        $('#cart-overlay').removeClass('show');
    });
    
    $('#checkout-btn').on('click', finalizarCompra);
    
    // Eventos dos modais
    $('#login-btn').on('click', function() {
        if (!usuarioLogado) {
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
    
    // Fechar modal de verificação
    $('[data-modal="verify"]').on('click', function() {
        $('#verify-modal').removeClass('show');
    });
    
    $('#show-register').on('click', function(e) {
        e.preventDefault();
        $('#login-modal').removeClass('show');
        $('#register-modal').addClass('show');
    });
    
    $('#show-login').on('click', function(e) {
        e.preventDefault();
        $('#register-modal').removeClass('show');
        $('#login-modal').addClass('show');
    });
    
    // Fechar modais clicando fora
    $('.modal-overlay').on('click', function(e) {
        if (e.target === this) {
            $(this).removeClass('show');
        }
    });
    
    // Formulário de login
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        const email = $('#login-email').val();
        const senha = $('#login-password').val();
        
        if (!email || !senha) {
            mostrarNotificacao('Preencha todos os campos', 'error');
            return;
        }
        
        login(email, senha);
    });
    
    // Formulário de cadastro
    $('#register-form').on('submit', function(e) {
        e.preventDefault();
        const nome = $('#register-name').val();
        const email = $('#register-email').val();
        const telefone = $('#register-phone').val();
        const senha = $('#register-password').val();
        const confirmarSenha = $('#register-confirm').val();
        
        if (!nome || !email || !telefone || !senha || !confirmarSenha) {
            mostrarNotificacao('Preencha todos os campos', 'error');
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
        
        cadastrar({ nome, email, telefone, senha });
    });
    
    // Modal de verificação
    $('#verify-btn').on('click', function() {
        const codigo = $('#verify-code').val();
        const email = window.emailVerificacao;
        
        if (!codigo || codigo.length !== 6) {
            mostrarNotificacao('Digite o código de 6 dígitos', 'error');
            return;
        }
        
        verificarCodigo(email, codigo);
    });
    
    $('#resend-code').on('click', function(e) {
        e.preventDefault();
        const email = window.emailVerificacao;
        reenviarCodigo(email);
    });
    
    // Newsletter
    $('.btn-newsletter').on('click', function() {
        const email = $('#newsletter-email').val();
        if (!email) {
            mostrarNotificacao('Digite um e-mail válido', 'error');
            return;
        }
        
        // Simular cadastro na newsletter
        setTimeout(() => {
            $('#newsletter-email').val('');
            mostrarNotificacao('E-mail cadastrado na newsletter com sucesso!', 'success');
        }, 500);
    });
    
    // Menu mobile
    $('.mobile-menu-toggle').on('click', function() {
        $('.nav-menu').toggleClass('show');
    });
    
    // Busca
    $('#search-input').on('keypress', function(e) {
        if (e.which === 13) {
            realizarBusca();
        }
    });
    
    $('.search-btn').on('click', realizarBusca);
    
    // Botão hero
    $('.btn-hero').on('click', function() {
        $('html, body').animate({
            scrollTop: $('.products-section').offset().top - 100
        }, 800);
    });
}

function realizarBusca() {
    const termo = $('#search-input').val().toLowerCase();
    if (!termo) return;
    
    const produtosFiltrados = produtos.filter(produto => 
        produto.nome.toLowerCase().includes(termo) ||
        produto.descricao.toLowerCase().includes(termo)
    );
    
    if (produtosFiltrados.length === 0) {
        mostrarNotificacao('Nenhum produto encontrado', 'error');
        return;
    }
    
    // Rolar para a seção de produtos
    $('html, body').animate({
        scrollTop: $('.products-section').offset().top - 100
    }, 800);
    
    // Destacar produtos encontrados
    $('.product-card').removeClass('highlight');
    produtosFiltrados.forEach(produto => {
        $(`.product-card[data-id="${produto.id}"]`).addClass('highlight');
    });
    
    setTimeout(() => {
        $('.product-card').removeClass('highlight');
    }, 3000);
}

// Formatação de telefone
$('#register-phone').on('input', function() {
    let valor = $(this).val().replace(/\D/g, '');
    valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
    valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    $(this).val(valor);
});

// Validação de e-mail
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Efeitos visuais
$(window).on('scroll', function() {
    const scrollTop = $(window).scrollTop();
    
    // Efeito parallax no hero
    $('.hero-images').css('transform', `translateY(${scrollTop * 0.3}px)`);
    
    // Animação dos produtos ao entrar na viewport
    $('.product-card').each(function() {
        const elementTop = $(this).offset().top;
        const windowBottom = $(window).scrollTop() + $(window).height();
        
        if (elementTop < windowBottom - 100) {
            $(this).addClass('animate-in');
        }
    });
});

// Adicionar classe de destaque para busca
const style = document.createElement('style');
style.textContent = `
    .product-card.highlight {
        transform: scale(1.05);
        box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
        z-index: 10;
        position: relative;
    }
    
    .product-card.animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
`;
document.head.appendChild(style);

// Funcionalidade de busca em tempo real
$('#search-input').on('input', function() {
    const termo = $(this).val().toLowerCase();
    
    if (termo.length > 2) {
        const sugestoes = produtos.filter(produto => 
            produto.nome.toLowerCase().includes(termo)
        ).slice(0, 3);
        
        // Aqui você pode implementar um dropdown de sugestões
        console.log('Sugestões:', sugestoes);
    }
});

// Adicionar funcionalidade de favoritos (opcional)
function toggleFavorito(produtoId) {
    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    
    if (favoritos.includes(produtoId)) {
        favoritos = favoritos.filter(id => id !== produtoId);
        mostrarNotificacao('Produto removido dos favoritos', 'success');
    } else {
        favoritos.push(produtoId);
        mostrarNotificacao('Produto adicionado aos favoritos', 'success');
    }
    
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

// Função para lidar com erros de imagem
$(document).on('error', 'img', function() {
    $(this).attr('src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbSBuw6NvIGVuY29udHJhZGE8L3RleHQ+PC9zdmc+');
});

// Função para mostrar modal de verificação
function mostrarModalVerificacao(email) {
    window.emailVerificacao = email;
    $('#verify-modal').addClass('show');
}

// Verificar código de e-mail
function verificarCodigo(email, codigo) {
    $.ajax({
        url: '/verificar-email',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, codigo }),
        success: function(response) {
            if (response.msg === "E-mail verificado com sucesso!") {
                $('#verify-modal').removeClass('show');
                mostrarNotificacao('E-mail verificado! Agora você pode fazer login.', 'success');
                setTimeout(() => {
                    $('#login-modal').addClass('show');
                }, 1000);
            } else {
                mostrarNotificacao(response.msg, 'error');
            }
        },
        error: function(xhr) {
            const erro = xhr.responseJSON?.msg || 'Erro ao verificar código';
            mostrarNotificacao(erro, 'error');
        }
    });
}

// Reenviar código
function reenviarCodigo(email) {
    $.ajax({
        url: '/novo-codigo',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email }),
        success: function(response) {
            mostrarNotificacao(response.msg, 'success');
        },
        error: function(xhr) {
            const erro = xhr.responseJSON?.msg || 'Erro ao reenviar código';
            mostrarNotificacao(erro, 'error');
        }
    });
}

// Adicionar smooth scroll para links internos
$('a[href^="#"]').on('click', function(e) {
    e.preventDefault();
    const target = $($(this).attr('href'));
    if (target.length) {
        $('html, body').animate({
            scrollTop: target.offset().top - 100
        }, 800);
    }
});

// Lazy loading para imagens (melhoria de performance)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}
