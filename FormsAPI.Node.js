const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors'); // Para permitir requisições do HTML

const app = express();
const PORT = 3000;

// Configuração do CORS para permitir requisições do seu HTML
app.use(cors());

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Conectar ao banco de dados SQLite
// O arquivo database.db será criado se não existir
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // Criar a tabela 'clientes' se ela não existir
        db.run(`CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            telefone TEXT
        )`, (createErr) => {
            if (createErr) {
                console.error('Erro ao criar tabela:', createErr.message);
            } else {
                console.log('Tabela "clientes" criada ou já existe.');
            }
        });
    }
});

// Rota para cadastrar um novo cliente (POST)
app.post('/clientes', (req, res) => {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    const sql = `INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)`;
    db.run(sql, [nome, email, telefone], function(err) {
        if (err) {
            console.error('Erro ao cadastrar cliente:', err.message);
            if (err.message.includes('UNIQUE constraint failed: clientes.email')) {
                return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
            }
            return res.status(500).json({ error: 'Erro interno ao cadastrar cliente.' });
        }
        res.status(201).json({ message: 'Cliente cadastrado com sucesso!', id: this.lastID });
    });
});

// Rota para obter todos os clientes (GET)
app.get('/clientes', (req, res) => {
    const sql = `SELECT * FROM clientes ORDER BY nome`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar clientes:', err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar clientes.' });
        }
        res.json(rows);
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Abra http://localhost:${PORT} no seu navegador para acessar o formulário.`);
});

// Fechar a conexão com o banco de dados quando o Node.js for encerrado
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados:', err.message);
        }
        console.log('Conexão com o banco de dados fechada.');
        process.exit(0);
    });
});