const db = require('./conexao');
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer')
const app = express();
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const { error } = require('console');
app.use(cors());
app.use(express.json());

app.use(session({
  secret: '46feb3e2fec47e6d6cd7bc44bfe1aef9',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 15 * 60 * 1000 }
}));

const transporter = nodemailer.createTransport({
  service: "gmail", // ou SMTP
  auth: {
    user: "ventiladorescalmarair@gmail.com",
    pass: "ezdo rdpm ylwd qmrf"
  }
});

app.post("/cadastro", async (req, res) => {
  const { nome_completo, data_nascimento, cpf, telefone, email, senha } = req.body;

  try {
    const salt = await bcrypt.genSalt(12);
    const hashSenha = await bcrypt.hash(senha, salt);//Hash da senha do usuario

    const codigo = crypto.randomInt(100000, 999999).toString();
    const hashCodigo = await bcrypt.hash(codigo, 10);//Hash do codigo

    const expiraEm = new Date(Date.now() + 15 * 60 * 1000);//o codigo se expira em 15 min 

    db.query(
      `INSERT INTO tb_usuarios 
      (Nome_completo, Data_nascimento, Cpf, Telefone, Email, Senha, Data_cadastro,
       verificado, codigo_verificacao, codigo_expira_em) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
      [nome_completo, data_nascimento, cpf, telefone, email,
        hashSenha, 0, hashCodigo, expiraEm], (erro) => {
          if (erro) {
            return res.json({ msg: "Erro ao cadastrar usuário", erro });
          }
          const htmlMensagem = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
            <div style="text-align: center;">
              <img src="blob:https://web.whatsapp.com/8240baf0-75ae-4e88-9a86-3d11694df1bd" alt="Logo do Sistema" style="width: 120px; margin-bottom: 20px;" />
            </div>
            <h2 style="color: #2E86C1;">Olá ${nome_completo}!</h2>
            <p>Seu código de verificação é:</p>
            <p style="font-size: 24px; font-weight: bold; color: #E67E22;">${codigo}</p>
            <p>Ele expira em <strong>15 minutos</strong>. ⏰</p>
            <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Se você não solicitou este código, ignore este e-mail.</p>
          </div>
        `;
          // Envia o código por e-mail
          transporter.sendMail(
            {
              from: "calma air <ventiladorescalmarair@gmail.com>",
              to: email,
              subject: "Verifique seu cadastro",
              html: htmlMensagem
            },
            (err) => {
              if (err) {
                return res.status(500).json({ msg: "Erro ao enviar e-mail", err });
              }
              res.json({ msg: "Usuário cadastrado! Verifique seu e-mail." });
            });
        });
  } catch (err) {
    res.json({ msg: "Erro no servidor", err });
  }
});// fim do endpoint /cadastro

// endpoint verificar email do usuario
app.post("/verificar-email", async (req, res) => {
  const { email, codigo } = req.body;

  db.query("SELECT * FROM tb_usuarios WHERE Email = ?", [email], async (erro, results) => {
    if (erro) return res.json({ msg: "Erro no servidor", erro });
    if (results.length === 0) return res.status(400).json({ msg: "Usuário não encontrado" });

    const usuario = results[0];


    if (usuario.verificado === 1) {
      return res.json({ msg: "E-mail já verificado" });
    }// Verifica se já foi confirmado


    if (new Date() > new Date(usuario.codigo_expira_em)) {
      return res.json({ msg: "Código expirado, peça um novo" });
    }// Verifica expiração do codigo

    const valido = await bcrypt.compare(codigo, usuario.codigo_verificacao);// Confere hash do codigo
    if (!valido) {
      return res.json({ msg: "Código inválido" });
    }

    db.query(
      "UPDATE tb_usuarios SET verificado = 1, codigo_verificacao = NULL, codigo_expira_em = NULL WHERE Email = ?",
      [email],
      (err2) => {
        if (err2) return res.json({ msg: "Erro ao atualizar usuário", err2 });
        res.json({ msg: "E-mail verificado com sucesso!" });
      }
    );// Marca como verificado
  });
}); // fim do endpoint verificar email


//endpoint fazer login
app.post('/logar', (req, res) => {
  const { email, senha } = req.body;
  db.query("SELECT * FROM tb_usuarios WHERE Email = ?", [email],
    async (erro, results) => {
      if (erro) {
        return res.json({ msg: "Erro no servidor", erro });
      }
      if (results.length === 0) {
        return res.json({ msg: "Usuário não encontrado" });
      }

      const usuario = results[0];
      try {
        const senhaValida = await bcrypt.compare(senha, usuario.Senha);
        if (!senhaValida) {
          return res.json({ msg: "Senha incorreta" });
        }

        req.session.usuarioLogado = usuario.IdUsuario;

        res.json({ msg: "Login bem-sucedido" });
      } catch (erro) {
        return res.json({ msg: "Erro ao validar senha", erro });
      }
    })
})//fim do endpoint /logar


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
app.get('/', verificarAutenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'privado', 'index.html'));
});
//fim do endpoint principal

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});