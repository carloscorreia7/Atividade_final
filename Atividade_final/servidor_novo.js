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

// Simulação de banco de dados em memória
let usuarios = [];
let codigosVerificacao = {};

// Endpoint de cadastro
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
      data_nascimento: data_nascimento || '1990-01-01',
      cpf: cpf || '000.000.000-00',
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

    console.log(`✅ Usuário cadastrado: ${email}`);
    console.log(`📧 Código de verificação: ${codigo}`);
    
    res.json({ 
      msg: "Usuário cadastrado com sucesso! Use o código: " + codigo,
      codigo: codigo // Para facilitar os testes
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ msg: "Erro no servidor", erro: err.message });
  }
});

// Endpoint verificar email
app.post("/verificar-email", async (req, res) => {
  const { email, codigo } = req.body;

  try {
    const usuario = usuarios.find(u => u.email === email);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    if (usuario.verificado) {
      return res.json({ msg: "E-mail já verificado" });
    }

    const codigoInfo = codigosVerificacao[email];
    if (!codigoInfo) {
      return res.status(400).json({ msg: "Código não encontrado" });
    }

    if (new Date() > codigoInfo.expiraEm) {
      return res.status(400).json({ msg: "Código expirado, peça um novo" });
    }

    if (codigo !== codigoInfo.codigo) {
      return res.status(400).json({ msg: "Código inválido" });
    }

    // Marcar como verificado
    usuario.verificado = true;
    delete codigosVerificacao[email];
    
    console.log(`✅ E-mail verificado: ${email}`);
    res.json({ msg: "E-mail verificado com sucesso!" });
  } catch (err) {
    console.error('Erro na verificação:', err);
    res.status(500).json({ msg: "Erro no servidor", erro: err.message });
  }
});

// Endpoint fazer login
app.post('/logar', async (req, res) => {
  const { email, senha } = req.body;
  
  try {
    const usuario = usuarios.find(u => u.email === email);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    if (!usuario.verificado) {
      return res.status(400).json({ msg: "Confirme seu e-mail antes de fazer login." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(400).json({ msg: "Senha incorreta" });
    }

    req.session.usuarioLogado = usuario.id;
    
    console.log(`✅ Login realizado: ${email}`);
    res.json({ 
      msg: "Login bem-sucedido",
      usuario: {
        id: usuario.id,
        nome: usuario.nome_completo,
        email: usuario.email
      }
    });
  } catch (erro) {
    console.error('Erro no login:', erro);
    res.status(500).json({ msg: "Erro ao validar senha", erro: erro.message });
  }
});

// Endpoint para novo código
app.post("/novo-codigo", async (req, res) => {
  const { email } = req.body;

  try {
    const usuario = usuarios.find(u => u.email === email);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
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

    console.log(`📧 Novo código para ${email}: ${codigo}`);
    res.json({ 
      msg: "Novo código gerado: " + codigo,
      codigo: codigo
    });
  } catch (err) {
    console.error('Erro ao gerar código:', err);
    res.status(500).json({ msg: "Erro no servidor", erro: err.message });
  }
});

// Endpoint logout
app.post('/logout', (req, res) => {
  req.session.destroy((erro) => {
    if (erro) {
      console.error('Erro ao destruir sessão:', erro);
      return res.status(500).json({ msg: 'Erro ao fazer logout.' });
    }
    res.json({ msg: 'Logout realizado com sucesso' });
  });
});

// Verificar se está autenticado
function verificarAutenticado(req, res, next) {
  if (req.session.usuarioLogado) {
    next();
  } else {
    res.status(401).json({ msg: 'Usuário não autenticado' });
  }
}

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para listar usuários (para debug)
app.get('/usuarios', (req, res) => {
  const usuariosSeguro = usuarios.map(u => ({
    id: u.id,
    nome: u.nome_completo,
    email: u.email,
    verificado: u.verificado,
    data_cadastro: u.data_cadastro
  }));
  res.json(usuariosSeguro);
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ msg: 'Erro interno do servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor CalmaAir rodando em http://localhost:${PORT}`);
  console.log(`📁 Servindo arquivos estáticos de: ${__dirname}`);
  console.log(`💾 Usando banco de dados em memória (para demonstração)`);
});
