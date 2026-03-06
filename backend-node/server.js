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
<<<<<<< HEAD
// 1. INICIALIZAÇÃO DO BANCO DE DADOS (SQLite)
// ==========================================
db.serialize(() => {
=======
// 1. INICIALIZAÇÃO E SEED DE DADOS
// ==========================================
db.serialize(() => {
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

>>>>>>> 3319da4 (gtin fixo)
    // Tabela de Listas Salvas
    db.run(`CREATE TABLE IF NOT EXISTS saved_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        listName TEXT,
        products JSON,
<<<<<<< HEAD
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
=======
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // AUTO-FIX: Adiciona colunas de localização se necessário
    const cols = ['storeName TEXT', 'latitude REAL', 'longitude REAL'];
    cols.forEach(col => {
        db.run(`ALTER TABLE users ADD COLUMN ${col}`, (err) => {});
    });

    // 🌱 SEED DE DADOS: Insere produtos reais se o banco estiver vazio
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (row && row.count === 0) {
            console.log("🌱 Populando banco com produtos base...");
            const seed = [
                ['Arroz Agulhinha 5kg', 'Tio João', '7896005800115', 29.90, 50, 1],
                ['Feijão Carioca 1kg', 'Kicaldo', '7896005801310', 7.50, 40, 1],
                ['Leite Integral 1L', 'Itambé', '7896051110015', 5.20, 100, 1],
                ['Óleo de Soja 900ml', 'Soya', '7891107000308', 6.80, 60, 1]
            ];
            const stmt = db.prepare("INSERT INTO products (name, brand, gtin, price, stock, ownerId) VALUES (?, ?, ?, ?, ?, ?)");
            seed.forEach(p => stmt.run(p));
            stmt.finalize();
        }
    });
});

// ==========================================
// 2. UTILITÁRIOS (Cálculo de Distância)
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
// 3. ROTAS DE PRODUTOS (COM ANTI-TRAVA)
// ==========================================

// Busca no Catálogo (Bluesoft + Fallback)
app.get('/api/products/search', async (req, res) => {
    const { q } = req.query;
    try {
        const response = await axios.get(`https://api.cosmos.bluesoft.com.br/products?query=${encodeURIComponent(q)}`, {
            headers: { 'X-Cosmos-Token': process.env.COSMOS_TOKEN },
            timeout: 4000
        });
        res.json(response.data);
    } catch (error) {
        console.log("⚠️ API Bluesoft offline ou excedida. Usando modo de simulação.");
        res.json([{ description: `${q} (Simulado)`, gtin: "7890000000000", brand: { name: "Genérico" } }]);
    }
});

// Criar Produto (Com lógica de emergência para Token excedido)
app.post('/api/products/create-from-gtin', async (req, res) => {
    const { gtin, price, stock, ownerId } = req.body;
    try {
        const response = await axios.get(`https://api.cosmos.bluesoft.com.br/gtins/${gtin}.json`, {
            headers: { 'X-Cosmos-Token': process.env.COSMOS_TOKEN }
        });
        const p = response.data;
        saveToDb(p.description, p.brand?.name || 'Marca Local', gtin, price, stock, ownerId, res);
    } catch (error) {
        console.log("🚀 Token Excedido. Criando produto com dados manuais.");
        saveToDb(`Produto GTIN ${gtin}`, 'Genérico', gtin, price, stock, ownerId, res);
    }
});

function saveToDb(name, brand, gtin, price, stock, ownerId, res) {
    const sql = `INSERT INTO products (name, brand, gtin, price, stock, ownerId) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [name, brand, gtin, price, stock, ownerId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Sucesso!" });
    });
}

// ==========================================
// 4. RANKING E GEOLOCALIZAÇÃO
// ==========================================
app.get('/api/consumer/ranking', (req, res) => {
    const { lat, lng, products } = req.query;
    if (!products) return res.json([]);
>>>>>>> 3319da4 (gtin fixo)
    const gtinList = products.split(',');

    const sql = `
        SELECT u.id as storeId, u.storeName, u.latitude, u.longitude, 
<<<<<<< HEAD
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
=======
               p.name, p.price, p.gtin
        FROM users u JOIN products p ON u.id = p.ownerId
        WHERE p.gtin IN (${gtinList.map(() => '?').join(',')})`;

    db.all(sql, gtinList, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const stores = {};
        rows.forEach(r => {
            if (!stores[r.storeId]) {
                stores[r.storeId] = { 
                    id: r.storeId, name: r.storeName, 
                    distance: calculateDistance(lat, lng, r.latitude, r.longitude),
                    totalPrice: 0, itemsFound: 0 
                };
            }
            stores[r.storeId].totalPrice += parseFloat(r.price);
            stores[r.storeId].itemsFound++;
        });
        const result = Object.values(stores).sort((a,b) => b.itemsFound - a.itemsFound || a.distance - b.distance);
        res.json(result);
    });
});

// ==========================================
// 5. AUTH E OUTRAS ROTAS
// ==========================================
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (row) res.json(row);
        else res.status(401).json({ error: "Inválido" });
    });
});

app.put('/api/auth/update-store', (req, res) => {
    const { id, storeName, latitude, longitude } = req.body;
    db.run("UPDATE users SET storeName = ?, latitude = ?, longitude = ? WHERE id = ?", [storeName, latitude, longitude, id], () => res.json({ ok: true }));
});

app.get('/api/products/all', (req, res) => {
    db.all("SELECT * FROM products", (err, rows) => res.json(rows));
});

// Rota de Salvar Listas (SQLite)
app.post('/api/consumer/lists', (req, res) => {
    const { userId, listName, products } = req.body;
    db.run("INSERT INTO saved_lists (userId, listName, products) VALUES (?, ?, ?)", [userId, listName, JSON.stringify(products)], () => res.json({ ok: true }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ON: ${PORT}`));
 3319da4 (gtin fixo)
