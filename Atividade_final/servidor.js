const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const app = express();
const session = require('express-session');
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
  secret: '46feb3e2fec47e6d6cd7bc44bfe1aef9',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 15 * 60 * 1000 }
}));

// Configuração do nodemailer removida para simplificar
// const transporter = nodemailer.createTransport({
//   service: "gmail", // ou SMTP
//   auth: {
//     user: "ventiladorescalmarair@gmail.com",
//     pass: "ezdo rdpm ylwd qmrf"
//   }
// });

// Simulação de banco de dados em memória (para demonstração)
let usuarios = [];
let codigosVerificacao = {};

app.post("/cadastro", async (req, res) => {
  const { nome_completo, data_nascimento, cpf, telefone, email, senha } = req.body;

  try {
    // Verificar se usuário já existe
    const usuarioExiste = usuarios.find(u => u.email === email);
    if (usuarioExiste) {
      return res.json({ msg: "E-mail já cadastrado" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashSenha = await bcrypt.hash(senha, salt);

    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

    // Salvar usuário em memória
    const novoUsuario = {
      id: usuarios.length + 1,
      nome_completo,
      data_nascimento,
      cpf,
      telefone,
      email,
      senha: hashSenha,
      verificado: false,
      data_cadastro: new Date()
    };

    usuarios.push(novoUsuario);
    codigosVerificacao[email] = {
      codigo,
      expiraEm
    };

    console.log(`Código de verificação para ${email}: ${codigo}`);
    
    res.json({ msg: "Usuário cadastrado! Código de verificação: " + codigo });
  } catch (err) {
    res.json({ msg: "Erro no servidor", err });
  }
});// fim do endpoint /cadastro

// endpoint verificar email do usuario
app.post("/verificar-email", async (req, res) => {
  const { email, codigo } = req.body;

  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) {
    return res.json({ msg: "Usuário não encontrado" });
  }

  if (usuario.verificado) {
    return res.json({ msg: "E-mail já verificado" });
  }

  const codigoInfo = codigosVerificacao[email];
  if (!codigoInfo) {
    return res.json({ msg: "Código não encontrado" });
  }

  if (new Date() > codigoInfo.expiraEm) {
    return res.json({ msg: "Código expirado, peça um novo" });
  }

  if (codigo !== codigoInfo.codigo) {
    return res.json({ msg: "Código inválido" });
  }

  // Marcar como verificado
  usuario.verificado = true;
  delete codigosVerificacao[email];
  
  res.json({ msg: "E-mail verificado com sucesso!" });
}); // fim do endpoint verificar email


//endpoint fazer login
app.post('/logar', async (req, res) => {
  const { email, senha } = req.body;
  
  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) {
    return res.json({ msg: "Usuário não encontrado" });
  }

  if (!usuario.verificado) {
    return res.json({ msg: "Confirme seu e-mail antes de fazer login." });
  }

  try {
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.json({ msg: "Senha incorreta" });
    }

    req.session.usuarioLogado = usuario.id;
    res.json({ 
      msg: "Login bem-sucedido",
      usuario: {
        id: usuario.id,
        nome: usuario.nome_completo,
        email: usuario.email
      }
    });
  } catch (erro) {
    return res.json({ msg: "Erro ao validar senha", erro });
  }
})//fim do endpoint /logar

// endpoint para pedir novo código
app.post("/novo-codigo", async (req, res) => {
  const { email } = req.body;

  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) {
    return res.json({ msg: "Usuário não encontrado" });
  }

  if (usuario.verificado) {
    return res.json({ msg: "Usuário já verificado, não precisa de novo código." });
  }

  // Gerar novo código
  const codigo = crypto.randomInt(100000, 999999).toString();
  const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

  codigosVerificacao[email] = {
    codigo,
    expiraEm
  };

  console.log(`Novo código para ${email}: ${codigo}`);
  res.json({ msg: "Novo código gerado: " + codigo });
});// fim do endpoint /novo-codigo


function verificarAutenticado(req, res, next) {
  if (req.session.usuarioLogado) {
    next();
  } else {
    res.redirect('/login');
  }
}//funcao verificar se ta logado

// endpoint deslogar 
app.get('/logout', (req, res) => {
  req.session.destroy((erro) => {
    if (erro) {
      console.error('Erro ao destruir sessão:', erro);
      return res.send('Erro ao fazer logout.');
    }
    res.redirect('/desconectado');
  });
});
// fim do endpoint /logout 

// pagina principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
//fim do endpoint principal

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});