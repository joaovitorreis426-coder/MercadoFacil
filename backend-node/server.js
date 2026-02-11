const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Banco de Dados
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// --- MODELOS ---

const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'consumer' },
    storeName: { type: DataTypes.STRING },
    storeType: { type: DataTypes.STRING },
    lat: { type: DataTypes.FLOAT },
    lng: { type: DataTypes.FLOAT }
});

// PRODUTO (SEM GTIN)
const Product = sequelize.define('Product', {
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'Ativo' },
    image: { type: DataTypes.STRING },
    ownerId: { type: DataTypes.INTEGER }
});

const ShoppingList = sequelize.define('ShoppingList', {
    name: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING },
    frequency: { type: DataTypes.STRING },
    items: { type: DataTypes.JSON },
    ownerId: { type: DataTypes.INTEGER }
});

User.hasMany(Product, { foreignKey: 'ownerId' });
Product.belongsTo(User, { foreignKey: 'ownerId' });

// --- ROTAS ---

// Auth
// 1. Autenticação (Login/Registro simplificado)
app.post('/api/auth/register', async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.json(user);
    } catch (e) {
        console.error('🛑 ERRO NO CADASTRO:', e);
        // Devolve o erro real para o navegador
        res.status(500).json({ error: e.message || 'Erro ao criar conta no Banco de Dados' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.body.email, password: req.body.password } });
        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ error: 'Dados inválidos' });
        }
    } catch (e) {
        console.error('🛑 ERRO NO LOGIN:', e);
        res.status(500).json({ error: e.message || 'Erro interno ao buscar usuário' });
    }
});

app.put('/api/user/update-profile', async (req, res) => {
    try {
        await User.update(req.body, { where: { email: req.body.email } });
        const user = await User.findOne({ where: { email: req.body.email } });
        res.json({ success: true, user });
    } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

// Produtos
app.get('/api/products', async (req, res) => {
    const products = await Product.findAll({ where: req.query.ownerId ? { ownerId: req.query.ownerId } : {} });
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    try { res.json(await Product.create(req.body)); } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

app.put('/api/products/:id', async (req, res) => {
    await Product.update(req.body, { where: { id: req.params.id } });
    res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
    await Product.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
});

app.get('/api/products/search', async (req, res) => {
    const products = await Product.findAll({ where: { name: { [Op.like]: `%${req.query.q}%` }, status: 'Ativo' }, limit: 10 });
    res.json([...new Set(products.map(p => p.name))]);
});

// Listas e Comparador
app.get('/api/lists', async (req, res) => {
    const lists = await ShoppingList.findAll({ where: { ownerId: req.query.ownerId } });
    res.json(lists.map(l => { const j = l.toJSON(); j.items = typeof j.items === 'string' ? JSON.parse(j.items) : j.items; return j; }));
});

app.post('/api/lists', async (req, res) => { await ShoppingList.create({ ...req.body, items: JSON.stringify(req.body.items) }); res.json({ success: true }); });
app.put('/api/lists/:id', async (req, res) => { await ShoppingList.update({ ...req.body, items: JSON.stringify(req.body.items) }, { where: { id: req.params.id } }); res.json({ success: true }); });
app.delete('/api/lists/:id', async (req, res) => { await ShoppingList.destroy({ where: { id: req.params.id } }); res.json({ success: true }); });

app.post('/api/compare', async (req, res) => {
    try {
        const { shoppingList, userLat, userLng } = req.body;
        const allProducts = await Product.findAll({ where: { status: 'Ativo' }, include: User });
        const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const listNorm = shoppingList.map(norm);
        
        const stores = {};
        allProducts.filter(p => listNorm.some(i => norm(p.name).includes(i))).forEach(p => {
            if(!p.User) return;
            const name = p.User.storeName || 'Loja';
            if(!stores[name]) stores[name] = { storeName: name, totalPrice: 0, foundItems: [], distance: (userLat && p.User.lat) ? getDistance(userLat, userLng, p.User.lat, p.User.lng) : null };
            stores[name].totalPrice += parseFloat(p.price.replace(',','.')) || 0;
            stores[name].foundItems.push({ name: p.name, price: p.price });
        });

        const ranking = Object.values(stores).sort((a,b) => (b.foundItems.length - a.foundItems.length) || (a.distance && b.distance ? a.distance - b.distance : a.totalPrice - b.totalPrice));
        res.json(ranking.slice(0,4));
    } catch(e) { res.status(500).json({ error: 'Erro' }); }
});

function getDistance(lat1,lon1,lat2,lon2) {
  const R=6371, dLat=d2r(lat2-lat1), dLon=d2r(lon2-lon1); 
  const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(d2r(lat1))*Math.cos(d2r(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2); 
  return parseFloat((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1));
}
function d2r(d) { return d*(Math.PI/180); }

// O { force: true } apaga o banco velho e recria um novo do zero com as colunas certas
sequelize.sync({ force: true }).then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
});