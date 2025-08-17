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

