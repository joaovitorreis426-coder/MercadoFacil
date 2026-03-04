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
// 1. INICIALIZAÇÃO DO BANCO DE DADOS (SQLite)
// ==========================================
db.serialize(() => {
   
   // --- DENTRO DO db.serialize ---
db.run(`CREATE TABLE IF NOT EXISTS saved_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    listName TEXT,
    products JSON, -- Guardaremos os GTINs como uma string JSON
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
)`);

// --- NOVAS ROTAS PARA LISTAS SALVAS ---

// 1. Salvar uma lista nova
app.post('/api/consumer/lists', (req, res) => {
    const { userId, listName, products } = req.body; // products deve ser um array de GTINs
    const sql = `INSERT INTO saved_lists (userId, listName, products) VALUES (?, ?, ?)`;
    db.run(sql, [userId, listName, JSON.stringify(products)], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Lista salva com sucesso!" });
    });
});

// 2. Buscar todas as listas de um usuário
app.get('/api/consumer/lists/:userId', (req, res) => {
    const { userId } = req.params;
    db.all(`SELECT * FROM saved_lists WHERE userId = ? ORDER BY createdAt DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Converte a string JSON de volta para Array antes de enviar
        const lists = rows.map(row => ({ ...row, products: JSON.parse(row.products) }));
        res.json(lists);
    });
});

// 3. Deletar uma lista
app.delete('/api/consumer/lists/:id', (req, res) => {
    db.run(`DELETE FROM saved_lists WHERE id = ?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Lista removida!" });
    });
});
    // Criar tabela de usuários se não existir
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

    // Criar tabela de produtos se não existir
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

    // AUTO-FIX: Adiciona colunas de localização caso a tabela de users já exista sem elas
    const columns = [
        { name: 'storeName', type: 'TEXT' },
        { name: 'latitude', type: 'REAL' },
        { name: 'longitude', type: 'REAL' }
    ];

    columns.forEach(col => {
        db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.log(`Nota: Coluna ${col.name} já preparada.`);
            }
        });
    });
});

// ==========================================
// 2. FUNÇÃO MATEMÁTICA (HAVERSINE)
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ==========================================
// 3. ROTAS DE AUTENTICAÇÃO E SETUP
// ==========================================

app.post('/api/auth/register', (req, res) => {
    const { name, email, password, type } = req.body;
    const sql = `INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, email, password, type || 'consumer'], function(err) {
        if (err) return res.status(400).json({ error: "E-mail já cadastrado" });
        res.json({ id: this.lastID, message: "Conta criada com sucesso!" });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        if (err || !user) return res.status(401).json({ error: "Credenciais inválidas" });
        res.json(user);
    });
});

// Setup da Loja (Vendedor)
app.put('/api/auth/update-store', (req, res) => {
    const { id, storeName, latitude, longitude } = req.body;
    db.run(`UPDATE users SET storeName = ?, latitude = ?, longitude = ? WHERE id = ?`, 
    [storeName, latitude, longitude, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Estabelecimento configurado!" });
    });
});

// ==========================================
// 4. PRODUTOS E BUSCA (COSMOS/BLUESOFT)
// ==========================================

app.get('/api/products/search', async (req, res) => {
    const { q } = req.query;
    try {
        const response = await axios.get(`https://api.cosmos.bluesoft.com.br/products?query=${encodeURIComponent(q)}`, {
            headers: { 'X-Cosmos-Token': process.env.COSMOS_TOKEN }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erro na Bluesoft:", error.message);
        res.status(500).json({ error: "Erro ao buscar no catálogo" });
    }
});

app.post('/api/products/create-from-gtin', (req, res) => {
    const { gtin, price, stock, ownerId } = req.body;
    // Primeiro busca o nome na Bluesoft para salvar no banco local
    axios.get(`https://api.cosmos.bluesoft.com.br/gtins/${gtin}.json`, {
        headers: { 'X-Cosmos-Token': process.env.COSMOS_TOKEN }
    }).then(response => {
        const p = response.data;
        const sql = `INSERT INTO products (name, brand, gtin, price, stock, ownerId) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [p.description, p.brand ? p.brand.name : 'Genérico', gtin, price, stock, ownerId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Produto adicionado ao estoque!" });
        });
    }).catch(() => res.status(500).json({ error: "GTIN não encontrado" }));
});

app.get('/api/products/all', (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==========================================
// 5. RANKING INTELIGENTE (CONSUMIDOR)
// ==========================================

app.get('/api/consumer/ranking', (req, res) => {
    const { lat, lng, products } = req.query;
    if (!products) return res.json([]);

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const gtinList = products.split(',');

    const sql = `
        SELECT u.id as storeId, u.storeName, u.latitude, u.longitude, 
               p.name as productName, p.price, p.gtin
        FROM users u
        JOIN products p ON u.id = p.ownerId
        WHERE p.gtin IN (${gtinList.map(() => '?').join(',')})
    `;

    db.all(sql, gtinList, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const storesMap = {};
        rows.forEach(row => {
            if (!storesMap[row.storeId]) {
                const distance = calculateDistance(userLat, userLng, row.latitude, row.longitude);
                storesMap[row.storeId] = {
                    id: row.storeId,
                    name: row.storeName || "Mercado Local",
                    distance: distance,
                    totalPrice: 0,
                    itemsFound: 0
                };
            }
            storesMap[row.storeId].totalPrice += parseFloat(row.price);
            storesMap[row.storeId].itemsFound += 1;
        });

        // Ordenação: 
        // 1. Mais itens encontrados (Lista completa primeiro)
        // 2. Mais perto (Menor distância)
        // 3. Mais barato
        const ranking = Object.values(storesMap).sort((a, b) => {
            if (b.itemsFound !== a.itemsFound) return b.itemsFound - a.itemsFound;
            if (Math.abs(a.distance - b.distance) > 0.5) return a.distance - b.distance; 
            return a.totalPrice - b.totalPrice;
        });

        res.json(ranking);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));