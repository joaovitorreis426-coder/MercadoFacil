const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const axios = require('axios');

const app = express();
const db = new sqlite3.Database('./database.db');

app.use(cors());
app.use(bodyParser.json());

// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO (Movid para o topo)
// ==========================================

app.post('/api/auth/register', (req, res) => {
    const { name, email, password, type } = req.body;
    console.log(`📝 Tentativa de registro: ${email}`);

    const sql = `INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, email, password, type || 'consumer'], function(err) {
        if (err) {
            console.error("❌ Erro no Registro:", err.message);
            return res.status(400).json({ error: "E-mail já cadastrado." });
        }
        res.json({ id: this.lastID, message: "Sucesso!" });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: "Erro interno" });
        if (row) {
            res.json(row);
        } else {
            res.status(401).json({ error: "Credenciais inválidas" });
        }
    });
});

app.put('/api/auth/update-store', (req, res) => {
    const { id, storeName, latitude, longitude } = req.body;
    db.run("UPDATE users SET storeName = ?, latitude = ?, longitude = ? WHERE id = ?", 
    [storeName, latitude, longitude, id], () => res.json({ ok: true }));
});

// ==========================================
// 2. INICIALIZAÇÃO DO BANCO (SEED)
// ==========================================
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, email TEXT UNIQUE, password TEXT, type TEXT,
        storeName TEXT, latitude REAL, longitude REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, brand TEXT, gtin TEXT, price REAL, stock INTEGER, ownerId INTEGER
    )`);

    // Seed do Catálogo (OwnerId NULL = Invisível no painel)
    db.get("SELECT COUNT(*) as count FROM products WHERE ownerId IS NULL", (err, row) => {
        if (row && row.count === 0) {
            const seed = [
                ['Arroz Agulhinha 5kg', 'Tio João', '7896005800115'],
                ['Feijão Carioca 1kg', 'Kicaldo', '7896005801310'],
                ['Leite Integral 1L', 'Itambé', '7896051110015'],
                ['Óleo de Soja 900ml', 'Soya', '7891107000308']
            ];
            const stmt = db.prepare("INSERT INTO products (name, brand, gtin, price, stock, ownerId) VALUES (?, ?, ?, 0, 0, NULL)");
            seed.forEach(p => stmt.run(p));
            stmt.finalize();
        }
    });
});

// ==========================================
// 3. ROTAS DE PRODUTOS E RANKING
// ==========================================

app.get('/api/products/all', (req, res) => {
    db.all("SELECT * FROM products WHERE ownerId IS NOT NULL", (err, rows) => {
        res.json(rows || []);
    });
});

app.get('/api/products/search', async (req, res) => {
    const { q } = req.query;
    db.all("SELECT * FROM products WHERE (name LIKE ? OR gtin = ?) AND ownerId IS NULL", [`%${q}%`, q], async (err, rows) => {
        if (rows && rows.length > 0) {
            return res.json(rows.map(r => ({ description: r.name, brand: { name: r.brand }, gtin: r.gtin })));
        }
        try {
            const response = await axios.get(`https://api.cosmos.bluesoft.com.br/products?query=${encodeURIComponent(q)}`, {
                headers: { 'X-Cosmos-Token': process.env.COSMOS_TOKEN }
            });
            res.json(response.data);
        } catch (e) {
            res.json([{ description: q, gtin: q, brand: { name: "Manual" } }]);
        }
    });
});

app.post('/api/products/create-from-gtin', (req, res) => {
    const { gtin, price, stock, ownerId } = req.body;
    db.get("SELECT * FROM products WHERE gtin = ? AND ownerId IS NULL", [gtin], (err, master) => {
        const sql = `INSERT INTO products (name, brand, gtin, price, stock, ownerId) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [master?.name || 'Novo Produto', master?.brand || 'Genérico', gtin, price, stock, ownerId], () => {
            res.json({ message: "OK" });
        });
    });
});

// Fallback para rotas não encontradas (Ajuda a debugar o 404)
app.use((req, res) => {
    console.log(`🚫 Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Rota ${req.url} não encontrada no servidor.` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));