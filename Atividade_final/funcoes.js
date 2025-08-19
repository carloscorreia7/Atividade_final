$(document).ready(function(){
    $(".cadastro-container").hide()
    $("#tela_escura").hide()
    $(".login-container").hide()
});

$("#cadastro_formulario").click(function () {
    $("#tela_escura").show()
    $(".cadastro-container").show()
});

$(".fechar_cadastro").click(function(){
    $(".cadastro-container").hide()
    $("#tela_escura").hide()
})

$(".fechar_login").click(function(){
    $("login-container").hide()
    $("#tela_escura").hide()
})

$("#login_formulario").click(function(){
    $("#tela_escura").show()
    $("#")
    $(".login-container").show()
})