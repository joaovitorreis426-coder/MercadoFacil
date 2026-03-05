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
    // Tabela de Listas Salvas
    db.run(`CREATE TABLE IF NOT EXISTS saved_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        listName TEXT,
        products JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    // Tabela de Usuários
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

    // Tabela de Produtos
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

    // AUTO-FIX: Colunas extras
    const columns = [
        { name: 'storeName', type: 'TEXT' },
        { name: 'latitude', type: 'REAL' },
        { name: 'longitude', type: 'REAL' }
    ];

    columns.forEach(col => {
        db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.log(`Nota: Coluna ${col.name} ok.`);
            }
        });
    });
});

// ==========================================
// 2. FUNÇÃO MATEMÁTICA (HAVERSINE)
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ==========================================
// 3. ROTAS DE AUTENTICAÇÃO E LISTAS
// ==========================================

app.post('/api/auth/register', (req, res) => {
    const { name, email, password, type } = req.body;
    db.run(`INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)`, 
    [name, email, password, type || 'consumer'], (err) => {
        if (err) return res.status(400).json({ error: "E-mail já cadastrado" });
        res.json({ message: "Conta criada com sucesso!" });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        if (err || !user) return res.status(401).json({ error: "Credenciais inválidas" });
        res.json(user);
    });
});

app.put('/api/auth/update-store', (req, res) => {
    const { id, storeName, latitude, longitude } = req.body;
    db.run(`UPDATE users SET storeName = ?, latitude = ?, longitude = ? WHERE id = ?`, 
    [storeName, latitude, longitude, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Configurado!" });
    });
});

// Rota de Salvar Listas
app.post('/api/consumer/lists', (req, res) => {
    const { userId, listName, products } = req.body;
    db.run(`INSERT INTO saved_lists (userId, listName, products) VALUES (?, ?, ?)`, 
    [userId, listName, JSON.stringify(products)], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Lista salva!" });
    });
});

// ==========================================
// 4. PRODUTOS E BUSCA (COM TRATAMENTO DE ERRO)
// ==========================================

app.get('/api/products/search', async (req, res) => {
    const { q } = req.query;
    try {
        const response = await axios.get(`https://api.cosmos.bluesoft.com.br/products?query=${encodeURIComponent(q)}`, {
            headers: { 'X-Cosmos-Token': process.env.COSMOS_TOKEN }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Erro na API Bluesoft" });
    }
});

app.post('/api/products/create-from-gtin', async (req, res) => {
    const { gtin, price, stock, ownerId } = req.body;

    console.log(`🚀 Tentando cadastrar produto. GTIN: ${gtin}, Usuário: ${ownerId}`);

    if (!ownerId) {
        return res.status(400).json({ error: "ID do dono do produto não fornecido." });
    }

    try {
        // Chamada para a Bluesoft
        const response = await axios.get(`https://api.cosmos.bluesoft.com.br/gtins/${gtin}.json`, {
            headers: { 
                'X-Cosmos-Token': process.env.COSMOS_TOKEN,
                'User-Agent': 'Cosmos-API-Request'
            }
        });

        const p = response.data;
        const sql = `INSERT INTO products (name, brand, gtin, price, stock, ownerId) VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [p.description, p.brand ? p.brand.name : 'Genérico', gtin, price, stock, ownerId], function(err) {
            if (err) {
                console.error("❌ Erro no SQLITE:", err.message);
                return res.status(500).json({ error: "Erro ao salvar no banco local." });
            }
            console.log("✅ Produto salvo com sucesso no banco!");
            res.json({ message: "Produto adicionado!" });
        });

    } catch (error) {
        console.error("❌ ERRO NA CHAMADA BLUESOFT:");
        if (error.response) {
            console.error("Status:", error.response.status); // 401 = Token Errado, 429 = Limite Excedido
            console.error("Data:", error.response.data);
        } else {
            console.error("Mensagem:", error.message);
        }
        res.status(500).json({ error: "Não foi possível validar o GTIN na Bluesoft. Verifique o Token no Render." });
    }
});

// Ranking Inteligente
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

        const ranking = Object.values(storesMap).sort((a, b) => {
            if (b.itemsFound !== a.itemsFound) return b.itemsFound - a.itemsFound;
            return a.distance - b.distance;
        });

        res.json(ranking);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor pronto na porta ${PORT}`));