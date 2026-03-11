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
// 1. INICIALIZAÇÃO E CATÁLOGO MESTRE (SEED)
// ==========================================
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        type TEXT DEFAULT 'consumer',
        storeName TEXT,
        latitude REAL,
        longitude REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        brand TEXT,
        gtin TEXT,
        price REAL,
        stock INTEGER,
        ownerId INTEGER,
        FOREIGN KEY(ownerId) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS saved_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        listName TEXT,
        products JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Geração do Catálogo Mestre (Invisível no Painel)
    db.get("SELECT COUNT(*) as count FROM products WHERE ownerId IS NULL", (err, row) => {
        if (row && row.count === 0) {
            console.log("🌱 Gerando Catálogo Mestre (Invisível)...");
            const seed = [
                ['Arroz Agulhinha 5kg', 'Tio João', '7896005800115'],
                ['Feijão Carioca 1kg', 'Kicaldo', '7896005801310'],
                ['Leite Integral 1L', 'Itambé', '7896051110015'],
                ['Óleo de Soja 900ml', 'Soya', '7891107000308'],
                ['Café Pilão 500g', 'Pilão', '7891095004128'],
                ['Macarrão Espaguete 500g', 'Adria', '7896005202117'],
                ['Detergente Líquido 500ml', 'Ypê', '7891022100114']
            ];
            const stmt = db.prepare("INSERT INTO products (name, brand, gtin, price, stock, ownerId) VALUES (?, ?, ?, 0, 0, NULL)");
            seed.forEach(p => stmt.run(p));
            stmt.finalize();
        }
    });
});

// ==========================================
// 2. FUNÇÕES AUXILIARES
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// ==========================================
// 3. ROTAS DE PRODUTOS
// ==========================================

app.get('/api/products/search', async (req, res) => {
    const { q } = req.query;
    db.all("SELECT * FROM products WHERE (name LIKE ? OR gtin = ?) AND ownerId IS NULL", [`%${q}%`, q], async (err, rows) => {
        if (rows && rows.length > 0) {
            const mapped = rows.map(r => ({ description: r.name, brand: { name: r.brand }, gtin: r.gtin }));
            return res.json(mapped);
        }
        // Se não achar local, tenta a API
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

app.post('/api/products/create-from-gtin', async (req, res) => {
    const { gtin, price, stock, ownerId } = req.body;
    db.get("SELECT * FROM products WHERE gtin = ? AND ownerId IS NULL", [gtin], async (err, master) => {
        const name = master ? master.name : `Produto ${gtin}`;
        const brand = master ? master.brand : 'Genérico';
        
        const sql = `INSERT INTO products (name, brand, gtin, price, stock, ownerId) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [name, brand, gtin, price, stock, ownerId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Sucesso!" });
        });
    });
});

// LISTAGEM FILTRADA: Só mostra produtos que TÊM dono
app.get('/api/products/all', (req, res) => {
    db.all("SELECT * FROM products WHERE ownerId IS NOT NULL", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Removido" });
    });
});

// ... (Restante das rotas de Auth e Ranking permanecem as mesmas)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (row) res.json(row);
        else res.status(401).json({ error: "Erro" });
    });
});

app.put('/api/auth/update-store', (req, res) => {
    const { id, storeName, latitude, longitude } = req.body;
    db.run("UPDATE users SET storeName = ?, latitude = ?, longitude = ? WHERE id = ?", [storeName, latitude, longitude, id], () => res.json({ ok: true }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));