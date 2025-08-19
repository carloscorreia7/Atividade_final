// Dados dos produtos
const produtos = [
    {
        id: 1,
        nome: "Refrigerador de ar usb portátil, ventilador elétrico sem folhas, temporizador silencioso de 6 velocidades",
        preco: 335.00,
        parcelas: "12x R$32",
        imagem: "ventilador.webp"
    },
    {
        id: 2,
        nome: "Ventilador e Umidificador - Torre Portátil sem Hélices 2024",
        preco: 429.90,
        parcelas: "12x R$52,22",
        imagem: "5-main-ventilador-eletrico-sem-folhas-portatil-refrigerador-de-ar-temporizador-silencioso-ar-condicionado-ventilador-umidificador-desktop-condicionado-fas-6-velocidade_800x.webp"
    },
    {
        id: 3,
        nome: "Ventilador Sem Pás De 3velocidades Com Rotação 106°e Luz Led",
        preco: 335.00,
        parcelas: "12x R$32",
        imagem: "D_Q_NP_2X_727104-MLB83958446298_052025-R.webp"
    },
    {
        id: 4,
        nome: "Ventilador de torre sem lâmina com modos de aquecimento/resfriamento",
        preco: 307.66,
        parcelas: "12x R$25,64",
        imagem: "ventilador1.webp"
    },
    {
        id: 5,
        nome: "Sistema de resfriamento de torre 3 em 1 com umidificador, purificador de ar",
        preco: 203.99,
        parcelas: "12x R$17,00",
        imagem: "shopping.webp"
    },
    {
        id: 6,
        nome: "Mini Ventilador Sem Hélice Portátil Recarregável Usb",
        preco: 44.99,
        parcelas: "12x R$3,75",
        imagem: "miniventiladorsemheliceblack.webp"
    }
];

// Carrinho de compras
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

// Função para salvar carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Função para adicionar produto ao carrinho
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
    mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`);
}

// Função para remover produto do carrinho
function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    salvarCarrinho();
    atualizarContadorCarrinho();
    atualizarCarrinho();
}

// Função para alterar quantidade
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

// Função para calcular total do carrinho
function calcularTotal() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

// Função para atualizar contador do carrinho
function atualizarContadorCarrinho() {
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    const contador = document.getElementById('contador-carrinho');
    if (contador) {
        contador.textContent = totalItens;
        contador.style.display = totalItens > 0 ? 'block' : 'none';
    }
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem) {
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao-carrinho';
    notificacao.textContent = mensagem;
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notificacao);
        }, 300);
    }, 3000);
}

// Função para atualizar conteúdo do carrinho
function atualizarCarrinho() {
    const carrinhoItens = document.getElementById('carrinho-itens');
    const carrinhoTotal = document.getElementById('carrinho-total');
    
    if (!carrinhoItens) return;
    
    carrinhoItens.innerHTML = '';
    
    if (carrinho.length === 0) {
        carrinhoItens.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio</p>';
        carrinhoTotal.textContent = 'R$ 0,00';
        return;
    }
    
    carrinho.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrinho-item';
        itemDiv.innerHTML = `
            <img src="${item.imagem}" alt="${item.nome}" class="carrinho-item-img">
            <div class="carrinho-item-info">
                <h6>${item.nome}</h6>
                <p class="preco">R$ ${item.preco.toFixed(2)}</p>
                <div class="quantidade-controle">
                    <button onclick="alterarQuantidade(${item.id}, ${item.quantidade - 1})" class="btn-quantidade">-</button>
                    <span class="quantidade">${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${item.id}, ${item.quantidade + 1})" class="btn-quantidade">+</button>
                </div>
            </div>
            <button onclick="removerDoCarrinho(${item.id})" class="btn-remover">🗑️</button>
        `;
        carrinhoItens.appendChild(itemDiv);
    });
    
    carrinhoTotal.textContent = `R$ ${calcularTotal().toFixed(2)}`;
}

$(document).ready(function(){
    $(".cadastro-container").hide();
    $("#tela_escura").hide();
    $(".login-container").hide();
    $(".carrinho-sidebar").hide();
    
    // Inicializar contador do carrinho
    atualizarContadorCarrinho();
    
    // Adicionar event listeners para os botões de comprar
    $('.btn-comprar').each(function(index) {
        $(this).click(function() {
            adicionarAoCarrinho(index + 1);
        });
    });
});

$("#cadastro_formulario").click(function () {
    $("#tela_escura").show();
    $(".cadastro-container").show();
});

$(".fechar_cadastro").click(function(){
    $(".cadastro-container").hide();
    $("#tela_escura").hide();
});

$(".fechar_login").click(function(){
    $(".login-container").hide();
    $("#tela_escura").hide();
});

$("#login_formulario").click(function(){
    $("#tela_escura").show();
    $(".login-container").show();
});

// Funcionalidade do carrinho
$("#carrinho").click(function(){
    $(".carrinho-sidebar").show().addClass('show');
    atualizarCarrinho();
});

$(".fechar-carrinho").click(function(){
    $(".carrinho-sidebar").removeClass('show');
    setTimeout(() => {
        $(".carrinho-sidebar").hide();
    }, 300);
});

// Finalizar compra
$("#finalizar-compra").click(function(){
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    const total = calcularTotal();
    const confirmacao = confirm(`Finalizar compra no valor de R$ ${total.toFixed(2)}?`);
    
    if (confirmacao) {
        carrinho = [];
        salvarCarrinho();
        atualizarContadorCarrinho();
        atualizarCarrinho();
        mostrarNotificacao('Compra finalizada com sucesso!');
        $(".carrinho-sidebar").hide();
    }
});