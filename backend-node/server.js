const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

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
    // NOVOS CAMPOS DE LOCALIZAÇÃO
    lat: { type: DataTypes.FLOAT }, 
    lng: { type: DataTypes.FLOAT }
});

const Product = sequelize.define('Product', {
    _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: DataTypes.STRING,
    status: DataTypes.STRING,
    price: DataTypes.STRING,
    ownerId: DataTypes.INTEGER
});

Product.belongsTo(User, { foreignKey: 'ownerId' });

sequelize.sync().then(() => console.log('💾 Banco Atualizado!'));

// --- ROTAS ---

// Rotas de Auth e Setup (Mantenha igual, mas o update-profile agora aceita lat/lng)
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, type } = req.body;
        const newUser = await User.create({ name, email, password, type });
        res.json({ success: true, user: newUser });
    } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password, type } = req.body;
    const user = await User.findOne({ where: { email, password, type } });
    if (user) res.json({ success: true, user });
    else res.status(401).json({ message: 'Erro' });
});

app.put('/api/user/setup-store', async (req, res) => {
    // Agora aceita lat e lng
    const { email, storeName, storeType, lat, lng } = req.body;
    const user = await User.findOne({ where: { email } });
    if (user) {
        user.storeName = storeName;
        user.storeType = storeType;
        if(lat) user.lat = lat;
        if(lng) user.lng = lng;
        await user.save();
        res.json({ success: true, user });
    }
});

app.put('/api/user/update-profile', async (req, res) => {
    const { email, storeName, storeType, lat, lng } = req.body;
    const user = await User.findOne({ where: { email } });
    if (user) {
        user.storeName = storeName;
        user.storeType = storeType;
        if(lat) user.lat = lat;
        if(lng) user.lng = lng;
        await user.save();
        res.json({ success: true, user });
    }
});

// NOVA ROTA: Buscar todas as lojas (Para o Mapa)
app.get('/api/sellers', async (req, res) => {
    // Busca apenas usuários do tipo 'seller' que tenham nome de loja
    const sellers = await User.findAll({ 
        where: { 
            type: 'seller',
            storeName: { [Op.ne]: null } // Onde storeName não é nulo
        },
        attributes: ['storeName', 'storeType', 'lat', 'lng', 'email'] // Só traz dados públicos
    });
    res.json(sellers);
});

// Rotas de Produtos (Com Validação no Backend também)
app.post('/api/products', async (req, res) => {
    const { name, price } = req.body;
    
    // VALIDAÇÃO BACKEND
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Nome obrigatório' });
    
    // Tenta converter preço para numero
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum < 0) return res.status(400).json({ error: 'Preço inválido' });

    const prod = await Product.create(req.body);
    res.json(prod);
});

// (As outras rotas de get/put/delete produtos e compare continuam iguais...)
app.get('/api/products', async (req, res) => {
    const { ownerId } = req.query; 
    if (ownerId && ownerId !== 'undefined') {
        const products = await Product.findAll({ where: { ownerId: ownerId } });
        res.json(products);
    } else {
        const products = await Product.findAll({ include: User });
        res.json(products);
    }
});
// ... (Adicione as rotas de delete/put/compare que você já tem aqui)

app.listen(PORT, () => console.log(`🔥 Servidor com Geolocalização rodando na porta ${PORT}`));