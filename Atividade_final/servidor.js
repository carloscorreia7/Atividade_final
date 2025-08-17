import bcrypt from "bcrypt";
import { json } from "stream/consumers";
const db = require('./conexao');
const express = require('express');
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

// endpoint cadastro de usuario
app.post('/cadastro', async (req, res) => {

  const { nome_completo, data_nascimento, cpf, telefone, email, senha } = req.body;

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(senha, salt);

  db.query(`INSERT INTO tb_usuarios (Nome_completo,Data_nascimento,cpf,
    Telefone,Email,Senha,Data_cadastro)VALUES (?,?,?,?,?,?,?)`,
    [nome_completo, data_nascimento, cpf, telefone, email, hash], (resposta, erro) => {
      if (erro) { return res.json({ msg: "falha ao cadastra usuario" }) }
      res.json({ msg: "usuario cadastrado com sucesso!!!" })
    });
});// fim do endpoint /cadastro

//endpoint fazer login
app.post('/logar', (req, res) => {
  const {email , senha} = req.body;
  db.query("SELECT * FROM tb_usuarios WHERE Email = ?",[email],
    async (erro, results) => {
      if (erro) {
        return res.json({ msg: "Erro no servidor", erro });
      }
      if (results.length === 0) {
        return res.json({ msg: "Usuário não encontrado" });
      }

      const usuario = results[0];
      try{
      const senhaValida = await bcrypt.compare(senha, usuario.Senha);
      if (!senhaValida) {
        return res.json({ msg: "Senha incorreta" });
      } 
      
      req.session.usuarioLogado = usuario.IdUsuario;

      res.json({ msg: "Login bem-sucedido"});
      }catch(erro){
        return res.json({ msg: "Erro ao validar senha", erro});
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