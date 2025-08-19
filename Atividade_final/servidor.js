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
app.use(express.static(__dirname));

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

  // Log para debug - ver o que está chegando do frontend
  console.log('Dados recebidos do frontend:', req.body);

  // Validar se todos os campos obrigatórios estão presentes
  if (!nome_completo || !telefone || !email || !senha) {
    return res.status(400).json({ msg: "Campos obrigatórios: nome_completo, telefone, email, senha" });
  }

  try {
    // Verificar se email já existe
    db.query("SELECT * FROM tb_usuarios WHERE Email = ?", [email], async (erro, results) => {
      if (erro) {
        console.error('Erro ao verificar email:', erro);
        return res.status(500).json({ msg: "Erro no servidor", erro: erro.message });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ msg: "E-mail já cadastrado" });
      }

      // Continuar com o cadastro
      const salt = await bcrypt.genSalt(12);
      const hashSenha = await bcrypt.hash(senha, salt);

      const codigo = crypto.randomInt(100000, 999999).toString();
      const hashCodigo = await bcrypt.hash(codigo, 10);

      const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

      db.query(
        `INSERT INTO tb_usuarios 
        (Nome_completo, Data_nascimento, Cpf, Telefone, Email, Senha, Data_cadastro,
         verificado, codigo_verificacao, codigo_expira_em) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
        [nome_completo, data_nascimento, cpf, telefone, email,
          hashSenha, 0, hashCodigo, expiraEm], (erro) => {
            if (erro) {
              console.error('Erro ao inserir no banco:', erro);
              return res.status(500).json({ msg: "Erro ao cadastrar usuário", erro: erro.message });
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
                console.error('Erro ao enviar e-mail:', err);
                return res.status(500).json({ msg: "Erro ao enviar e-mail", erro: err.message });
              }
              res.json({ msg: "Usuário cadastrado! Verifique seu e-mail." });
            });
        });
    });
  } catch (err) {
    console.error('Erro geral no cadastro:', err);
    res.status(500).json({ msg: "Erro no servidor", erro: err.message });
  }
});// fim do endpoint /cadastro

// endpoint verificar email do usuario
app.post("/verificar-email", async (req, res) => {
  const { email, codigo } = req.body;

  db.query("SELECT * FROM tb_usuarios WHERE Email = ?", [email], async (erro, results) => {
    if (erro) return res.json({ msg: "Erro no servidor", erro });
    if (results.length === 0) return res.json({ msg: "Usuário não encontrado" });

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

      if (usuario.verificado === 0) {
      return res.json({ msg: "Confirme seu e-mail antes de fazer login." });
      }

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

// endpoint para pedir novo código
app.post("/novo-codigo", async (req, res) => {
  const { email } = req.body;

  db.query("SELECT * FROM tb_usuarios WHERE Email = ?", [email], async (erro, results) => {
    if (erro) return res.json({ msg: "Erro no servidor", erro });
    if (results.length === 0) return res.json({ msg: "Usuário não encontrado" });

    const usuario = results[0];

    if (usuario.verificado === 1) {
      return res.json({ msg: "Usuário já verificado, não precisa de novo código." });
    }

    // Gerar novo código
    const codigo = crypto.randomInt(100000, 999999).toString();
    const hashCodigo = await bcrypt.hash(codigo, 10);
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

    // Atualizar no banco
    db.query(
      "UPDATE tb_usuarios SET codigo_verificacao = ?, codigo_expira_em = ? WHERE Email = ?",
      [hashCodigo, expiraEm, email],
      (err2) => {
        if (err2) return res.json({ msg: "Erro ao gerar novo código", err2 });

        const htmlMensagem = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
            <h2 style="color: #2E86C1;">Olá ${usuario.Nome_completo}!</h2>
            <p>Seu novo código de verificação é:</p>
            <p style="font-size: 24px; font-weight: bold; color: #E67E22;">${codigo}</p>
            <p>Ele expira em <strong>15 minutos</strong>. ⏰</p>
            <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Se você não solicitou este código, ignore este e-mail.</p>
          </div>
        `;

        transporter.sendMail(
          {
            from: "calma air <ventiladorescalmarair@gmail.com>",
            to: email,
            subject: "Novo código de verificação",
            html: htmlMensagem
          },
          (err3) => {
            if (err3) return res.json({ msg: "Erro ao enviar e-mail", err3 });
            res.json({ msg: "Novo código enviado para seu e-mail." });
          }
        );
      });
  });
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

// Middleware para verificar se usuário está logado (para APIs)
function verificarLogin(req, res, next) {
  if (!req.session.usuarioLogado) {
    return res.status(401).json({ msg: "Usuário não logado" });
  }
  next();
}

// Endpoint para verificar status do login
app.get('/verificar-login', (req, res) => {
  if (req.session.usuarioLogado) {
    db.query("SELECT Nome_completo, Email FROM tb_usuarios WHERE IdUsuario = ?", 
      [req.session.usuarioLogado], (erro, results) => {
        if (erro || results.length === 0) {
          return res.json({ logado: false });
        }
        res.json({ 
          logado: true, 
          usuario: {
            nome: results[0].Nome_completo,
            email: results[0].Email
          }
        });
      });
  } else {
    res.json({ logado: false });
  }
});

// Endpoints do Carrinho
app.post('/carrinho/adicionar', verificarLogin, (req, res) => {
  const { produto_id, nome, preco, quantidade, imagem } = req.body;
  const usuario_id = req.session.usuarioLogado;

  if (!produto_id || !nome || !preco || !quantidade) {
    return res.status(400).json({ msg: "Dados incompletos" });
  }

  // Verificar se produto já existe no carrinho
  db.query(
    "SELECT * FROM tb_carrinho WHERE usuario_id = ? AND produto_id = ?",
    [usuario_id, produto_id],
    (erro, results) => {
      if (erro) {
        return res.status(500).json({ msg: "Erro no servidor", erro: erro.message });
      }

      if (results.length > 0) {
        // Atualizar quantidade
        const novaQuantidade = results[0].quantidade + parseInt(quantidade);
        db.query(
          "UPDATE tb_carrinho SET quantidade = ? WHERE usuario_id = ? AND produto_id = ?",
          [novaQuantidade, usuario_id, produto_id],
          (erro2) => {
            if (erro2) {
              return res.status(500).json({ msg: "Erro ao atualizar carrinho", erro: erro2.message });
            }
            res.json({ msg: "Produto atualizado no carrinho" });
          }
        );
      } else {
        // Adicionar novo produto
        db.query(
          "INSERT INTO tb_carrinho (usuario_id, produto_id, nome, preco, quantidade, imagem, data_adicao) VALUES (?, ?, ?, ?, ?, ?, NOW())",
          [usuario_id, produto_id, nome, preco, quantidade, imagem],
          (erro2) => {
            if (erro2) {
              return res.status(500).json({ msg: "Erro ao adicionar ao carrinho", erro: erro2.message });
            }
            res.json({ msg: "Produto adicionado ao carrinho" });
          }
        );
      }
    }
  );
});

app.get('/carrinho/listar', verificarLogin, (req, res) => {
  const usuario_id = req.session.usuarioLogado;

  db.query(
    "SELECT * FROM tb_carrinho WHERE usuario_id = ? ORDER BY data_adicao DESC",
    [usuario_id],
    (erro, results) => {
      if (erro) {
        return res.status(500).json({ msg: "Erro no servidor", erro: erro.message });
      }
      res.json({ carrinho: results });
    }
  );
});

app.put('/carrinho/atualizar', verificarLogin, (req, res) => {
  const { produto_id, quantidade } = req.body;
  const usuario_id = req.session.usuarioLogado;

  if (quantidade <= 0) {
    return res.status(400).json({ msg: "Quantidade deve ser maior que zero" });
  }

  db.query(
    "UPDATE tb_carrinho SET quantidade = ? WHERE usuario_id = ? AND produto_id = ?",
    [quantidade, usuario_id, produto_id],
    (erro) => {
      if (erro) {
        return res.status(500).json({ msg: "Erro ao atualizar carrinho", erro: erro.message });
      }
      res.json({ msg: "Carrinho atualizado" });
    }
  );
});

app.delete('/carrinho/remover', verificarLogin, (req, res) => {
  const { produto_id } = req.body;
  const usuario_id = req.session.usuarioLogado;

  db.query(
    "DELETE FROM tb_carrinho WHERE usuario_id = ? AND produto_id = ?",
    [usuario_id, produto_id],
    (erro) => {
      if (erro) {
        return res.status(500).json({ msg: "Erro ao remover do carrinho", erro: erro.message });
      }
      res.json({ msg: "Produto removido do carrinho" });
    }
  );
});

app.delete('/carrinho/limpar', verificarLogin, (req, res) => {
  const usuario_id = req.session.usuarioLogado;

  db.query(
    "DELETE FROM tb_carrinho WHERE usuario_id = ?",
    [usuario_id],
    (erro) => {
      if (erro) {
        return res.status(500).json({ msg: "Erro ao limpar carrinho", erro: erro.message });
      }
      res.json({ msg: "Carrinho limpo" });
    }
  );
});

// Endpoint para finalizar compra
app.post('/finalizar-compra', verificarLogin, (req, res) => {
  const usuario_id = req.session.usuarioLogado;
  const { endereco, forma_pagamento } = req.body;

  if (!endereco || !forma_pagamento) {
    return res.status(400).json({ msg: "Endereço e forma de pagamento são obrigatórios" });
  }

  // Buscar itens do carrinho
  db.query(
    "SELECT * FROM tb_carrinho WHERE usuario_id = ?",
    [usuario_id],
    (erro, carrinho) => {
      if (erro) {
        return res.status(500).json({ msg: "Erro no servidor", erro: erro.message });
      }

      if (carrinho.length === 0) {
        return res.status(400).json({ msg: "Carrinho vazio" });
      }

      // Calcular total
      const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

      // Criar pedido
      db.query(
        "INSERT INTO tb_pedidos (usuario_id, total, endereco, forma_pagamento, status, data_pedido) VALUES (?, ?, ?, ?, 'pendente', NOW())",
        [usuario_id, total, endereco, forma_pagamento],
        (erro2, result) => {
          if (erro2) {
            return res.status(500).json({ msg: "Erro ao criar pedido", erro: erro2.message });
          }

          const pedido_id = result.insertId;

          // Inserir itens do pedido
          const itensPromises = carrinho.map(item => {
            return new Promise((resolve, reject) => {
              db.query(
                "INSERT INTO tb_itens_pedido (pedido_id, produto_id, nome, preco, quantidade) VALUES (?, ?, ?, ?, ?)",
                [pedido_id, item.produto_id, item.nome, item.preco, item.quantidade],
                (erro3) => {
                  if (erro3) reject(erro3);
                  else resolve();
                }
              );
            });
          });

          Promise.all(itensPromises)
            .then(() => {
              // Limpar carrinho após finalizar pedido
              db.query(
                "DELETE FROM tb_carrinho WHERE usuario_id = ?",
                [usuario_id],
                (erro4) => {
                  if (erro4) {
                    console.error('Erro ao limpar carrinho:', erro4);
                  }
                  res.json({ 
                    msg: "Pedido realizado com sucesso!", 
                    pedido_id: pedido_id,
                    total: total
                  });
                }
              );
            })
            .catch(erro => {
              res.status(500).json({ msg: "Erro ao processar itens do pedido", erro: erro.message });
            });
        }
      );
    }
  );
});

// pagina principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
//fim do endpoint principal

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});