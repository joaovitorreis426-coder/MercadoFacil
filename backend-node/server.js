require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// 1. Configuração do Banco de Dados
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// 2. MODELOS (Tabelas)
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

// ⭐️ ATUALIZADO: Produto agora tem GTIN, Marca e Estoque!
const Product = sequelize.define('Product', {
    gtin: { type: DataTypes.STRING, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    brand: { type: DataTypes.STRING },
    ncm: { type: DataTypes.STRING },
    price: { type: DataTypes.STRING, allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    category: { type: DataTypes.STRING, defaultValue: 'Geral' },
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

// ⭐️ A ROTA NOVA DO COSMOS ENTRA AQUI!
app.use('/api/products', productRoutes);

// 3. ROTAS DE AUTENTICAÇÃO E PERFIL
app.post('/api/auth/register', async (req, res) => {
    try { const user = await User.create(req.body); res.json(user); } 
    catch (e) { res.status(500).json({ error: 'Erro ao criar conta' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.body.email, password: req.body.password } });
        if (user) res.json(user); else res.status(401).json({ error: 'Dados inválidos' });
    } catch(e) { res.status(500).json({ error: 'Erro no login' }); }
});

app.put('/api/user/update-profile', async (req, res) => {
    try {
        const { email, storeName, storeType, lat, lng } = req.body;
        if(!email) return res.status(400).json({error: "Email não fornecido."});
        await User.update({ storeName, storeType, lat, lng }, { where: { email: email } });
        const user = await User.findOne({ where: { email: email } });
        if(user) res.json({ success: true, user });
        else res.status(404).json({ error: 'Usuário não encontrado' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sellers', async (req, res) => {
    try {
        const sellers = await User.findAll({ where: { type: 'seller' }, attributes: ['id', 'storeName', 'storeType', 'lat', 'lng'] });
        res.json(sellers);
    } catch(e) { res.status(500).json({ error: 'Erro ao buscar vendedores' }); }
});

// 4. ROTAS ANTIGAS DE PRODUTOS (Mantidas para a tela de lista funcionar)
app.get('/api/products/all', async (req, res) => {
    const products = await Product.findAll({ where: req.query.ownerId ? { ownerId: req.query.ownerId } : {} });
    res.json(products);
});
app.put('/api/products/:id', async (req, res) => {
    await Product.update(req.body, { where: { id: req.params.id } }); res.json({ success: true });
});
app.delete('/api/products/:id', async (req, res) => {
    await Product.destroy({ where: { id: req.params.id } }); res.json({ success: true });
});
// Rota antiga de '/search' FOI APAGADA PARA NÃO DAR CONFLITO COM A BLUESOFT!

// 5. ROTAS DE LISTAS DE COMPRAS E COMPARADOR
app.get('/api/lists', async (req, res) => {
    const lists = await ShoppingList.findAll({ where: { ownerId: req.query.ownerId } });
    res.json(lists.map(l => { const j = l.toJSON(); j.items = typeof j.items === 'string' ? JSON.parse(j.items) : j.items; return j; }));
});
app.post('/api/lists', async (req, res) => { await ShoppingList.create({ ...req.body, items: JSON.stringify(req.body.items) }); res.json({ success: true }); });
app.put('/api/lists/:id', async (req, res) => { await ShoppingList.update({ ...req.body, items: JSON.stringify(req.body.items) }, { where: { id: req.params.id } }); res.json({ success: true }); });
app.delete('/api/lists/:id', async (req, res) => { await ShoppingList.destroy({ where: { id: req.params.id } }); res.json({ success: true }); });

function getDistance(lat1,lon1,lat2,lon2) {
    const R=6371, dLat=d2r(lat2-lat1), dLon=d2r(lon2-lon1); 
    const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(d2r(lat1))*Math.cos(d2r(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2); 
    return parseFloat((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1));
}
function d2r(d) { return d*(Math.PI/180); }

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
            stores[name].totalPrice += parseFloat(String(p.price).replace(',','.')) || 0;
            stores[name].foundItems.push({ name: p.name, price: p.price });
        });

        const ranking = Object.values(stores).sort((a,b) => (b.foundItems.length - a.foundItems.length) || (a.distance && b.distance ? a.distance - b.distance : a.totalPrice - b.totalPrice));
        res.json(ranking.slice(0,4));
    } catch(e) { 
        console.error("🚨 ERRO GRAVE NO COMPARADOR:", e);
        res.status(500).json({ error: 'Erro interno', detalhes: e.message }); 
    }
});

sequelize.sync({ alter: true }).then(() => app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`)));