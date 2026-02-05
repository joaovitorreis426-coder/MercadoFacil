const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes, Op } = require('sequelize');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- AUTO-LIMPEZA PARA EVITAR ERROS NO RENDER ---
try {
    const dbPath = './database.sqlite';
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('🗑️ BANCO RESETADO PARA ATUALIZAÇÃO DE ESTRUTURA.');
    }
} catch (err) { console.error(err); }
// ------------------------------------------------

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// --- MODELOS ---
const User = sequelize.define('User', {
    _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    storeName: DataTypes.STRING,
    storeType: DataTypes.STRING,
    lat: { type: DataTypes.FLOAT }, 
    lng: { type: DataTypes.FLOAT }
});

const Product = sequelize.define('Product', {
    _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: DataTypes.STRING,
    description: DataTypes.STRING, 
    category: DataTypes.STRING,
    status: DataTypes.STRING,
    price: DataTypes.STRING,
    ownerId: DataTypes.INTEGER
});

// --- NOVO MODELO: LISTA DE COMPRAS ---
const ShoppingList = sequelize.define('ShoppingList', {
    _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: DataTypes.STRING,        // Ex: "Compra do Mês"
    category: DataTypes.STRING,    // Ex: "Limpeza"
    frequency: DataTypes.STRING,   // "Semanal" ou "Mensal"
    items: DataTypes.TEXT,         // Guardaremos como TEXTO (JSON)
    ownerId: DataTypes.INTEGER
});

Product.belongsTo(User, { foreignKey: 'ownerId' });
ShoppingList.belongsTo(User, { foreignKey: 'ownerId' }); // Lista pertence ao Usuário

sequelize.sync({ force: true }).then(() => console.log('💾 Banco e Tabelas Criados!'));

function normalizeString(str) {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// --- ROTAS PADRÃO (Login, Produtos, etc - Mantidas iguais) ---

app.get('/', (req, res) => res.send('🚀 API Online!'));

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, type } = req.body;
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ message: 'Email já existe' });
        const newUser = await User.create({ name, email, password, type });
        res.json({ success: true, user: newUser });
    } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password, type } = req.body;
        const user = await User.findOne({ where: { email, password, type } });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ message: 'Erro login' });
    } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

app.put('/api/user/update-profile', async (req, res) => {
    const { email, storeName, storeType, lat, lng } = req.body;
    let user = await User.findOne({ where: { email } });
    if (!user) {
        user = await User.create({ email, name: 'Recuperado', password: '123', type: 'seller', storeName, storeType, lat, lng });
        return res.json({ success: true, user });
    }
    user.storeName = storeName; user.storeType = storeType; if (lat) user.lat = lat; if (lng) user.lng = lng;
    await user.save();
    res.json({ success: true, user });
});

app.get('/api/sellers', async (req, res) => {
    const sellers = await User.findAll({ where: { type: 'seller', storeName: { [Op.ne]: null } } });
    res.json(sellers);
});

app.get('/api/products', async (req, res) => {
    const { ownerId } = req.query; 
    const where = ownerId && ownerId !== 'undefined' ? { ownerId } : {};
    const products = await Product.findAll({ where, include: User });
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    try {
        const ownerId = parseInt(req.body.ownerId); 
        const owner = await User.findByPk(ownerId);
        if (!owner) return res.status(404).json({ error: 'Usuário não encontrado' });
        const prod = await Product.create({ ...req.body, ownerId });
        res.json(prod);
    } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

app.put('/api/products/:id', async (req, res) => {
    await Product.update(req.body, { where: { _id: req.params.id } });
    res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
    await Product.destroy({ where: { _id: req.params.id } });
    res.json({ success: true });
});

app.get('/api/products/search', async (req, res) => {
    try {
        const { q } = req.query; if (!q || q.length < 2) return res.json([]);
        const allProducts = await Product.findAll({ where: { status: 'Ativo' }, attributes: ['name'] });
        const filtered = allProducts.filter(p => normalizeString(p.name).includes(normalizeString(q))).map(p => p.name);
        res.json([...new Set(filtered)].slice(0, 10));
    } catch (error) { res.status(500).json([]); }
});

// --- ROTAS NOVAS: GERENCIAMENTO DE LISTAS ---

// 1. Salvar Lista
app.post('/api/lists', async (req, res) => {
    try {
        const { name, category, frequency, items, ownerId } = req.body;
        // items vem como Array ["Arroz", "Feijão"], convertemos para String JSON
        const newList = await ShoppingList.create({
            name, category, frequency, ownerId,
            items: JSON.stringify(items) 
        });
        res.json(newList);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao salvar lista' }); }
});

// 2. Pegar Listas do Usuário
app.get('/api/lists', async (req, res) => {
    try {
        const { ownerId } = req.query;
        const lists = await ShoppingList.findAll({ where: { ownerId } });
        // Converte o texto JSON de volta para Array
        const formattedLists = lists.map(l => ({
            ...l.dataValues,
            items: JSON.parse(l.items)
        }));
        res.json(formattedLists);
    } catch (e) { res.status(500).json({ error: 'Erro ao buscar listas' }); }
});

// 3. Deletar Lista
app.delete('/api/lists/:id', async (req, res) => {
    await ShoppingList.destroy({ where: { _id: req.params.id } });
    res.json({ success: true });
});

// --- ROTA DE COMPARAÇÃO (MELHORADA) ---
app.post('/api/compare', async (req, res) => {
    try {
        const { shoppingList } = req.body;
        if (!shoppingList || shoppingList.length === 0) return res.json([]);
        const allProducts = await Product.findAll({ where: { status: 'Ativo' }, include: User });
        const normalizedList = shoppingList.map(item => normalizeString(item));
        const matchedProducts = allProducts.filter(p => {
            const pName = normalizeString(p.name);
            return normalizedList.some(item => pName.includes(item));
        });
        const storeGroups = {};
        matchedProducts.forEach(p => {
            const storeName = p.User ? p.User.storeName : 'Loja Desconhecida';
            if (!storeGroups[storeName]) storeGroups[storeName] = { storeName, totalPrice: 0, foundItems: [] };
            const priceFloat = parseFloat(p.price.replace(',', '.')) || 0;
            storeGroups[storeName].totalPrice += priceFloat;
            storeGroups[storeName].foundItems.push({ name: p.name, price: p.price, description: p.description });
        });
        
        const ranking = Object.values(storeGroups).sort((a, b) => {
            const dif = b.foundItems.length - a.foundItems.length;
            if (dif !== 0) return dif;
            return a.totalPrice - b.totalPrice;
        });
        res.json(ranking);
    } catch (error) { res.status(500).json({ error: 'Erro ao comparar' }); }
});

app.listen(PORT, () => console.log(`🔥 Servidor rodando na porta ${PORT}`));