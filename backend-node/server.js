const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


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
    description: DataTypes.STRING, // <--- CAMPO NOVO!
    status: DataTypes.STRING,
    price: DataTypes.STRING,
    ownerId: DataTypes.INTEGER
});

Product.belongsTo(User, { foreignKey: 'ownerId' });

sequelize.sync().then(() => console.log('💾 Banco Sincronizado (Com Descrição)!'));

// Função Remove Acentos
function normalizeString(str) {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// --- ROTAS ---

// Auth e Setup (Iguais)
// 1. REGISTRO (Com validação de senha)
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, type } = req.body;
        
        // --- VALIDAÇÃO DE SEGURANÇA ---
        if (!password || password.length <= 7) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
        }
        // ------------------------------

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email já existe' });

        const newUser = await User.create({ name, email, password, type });
        res.json({ success: true, user: newUser });
    } catch (e) { res.status(500).json({ error: 'Erro no registro' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password, type } = req.body;
        const user = await User.findOne({ where: { email, password, type } });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ message: 'Dados incorretos' });
    } catch (e) { res.status(500).json({ error: 'Erro no login' }); }
});

app.put('/api/user/setup-store', async (req, res) => { updateStore(req, res); });
app.put('/api/user/update-profile', async (req, res) => { updateStore(req, res); });

async function updateStore(req, res) {
    const { email, storeName, storeType, lat, lng } = req.body;
    const user = await User.findOne({ where: { email } });
    if (user) {
        user.storeName = storeName;
        user.storeType = storeType;
        if(lat) user.lat = lat;
        if(lng) user.lng = lng;
        await user.save();
        res.json({ success: true, user });
    } else res.status(404).json({ error: 'User not found' });
}

app.get('/api/sellers', async (req, res) => {
    const sellers = await User.findAll({ 
        where: { type: 'seller', storeName: { [Op.ne]: null } },
        attributes: ['storeName', 'storeType', 'lat', 'lng', 'email']
    });
    res.json(sellers);
});

// Produtos (Agora aceita description)
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

app.post('/api/products', async (req, res) => {
    try {
        // O body agora traz description
        const prod = await Product.create(req.body); 
        res.json(prod);
    } catch (e) { res.status(500).json({ error: 'Erro ao criar' }); }
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
        const { q } = req.query; 
        if (!q || q.length < 2) return res.json([]);
        const allProducts = await Product.findAll({ attributes: ['name'] });
        const searchNormalized = normalizeString(q);
        const filtered = allProducts
            .filter(p => normalizeString(p.name).includes(searchNormalized))
            .map(p => p.name);
        res.json([...new Set(filtered)].slice(0, 10));
    } catch (error) { res.status(500).json([]); }
});

// COMPARADOR (Agora retorna objetos com descrição)
app.post('/api/compare', async (req, res) => {
    try {
        const { shoppingList } = req.body;
        if (!shoppingList || shoppingList.length === 0) return res.json([]);

        const allProducts = await Product.findAll({ include: User });
        const normalizedList = shoppingList.map(item => normalizeString(item));

        const matchedProducts = allProducts.filter(p => {
            const pName = normalizeString(p.name);
            return normalizedList.some(item => pName.includes(item));
        });

        const storeGroups = {};

        matchedProducts.forEach(p => {
            const storeName = p.User ? p.User.storeName : 'Loja Desconhecida';
            
            if (!storeGroups[storeName]) {
                storeGroups[storeName] = {
                    storeName: storeName,
                    totalPrice: 0,
                    foundItems: []
                };
            }

            const priceFloat = parseFloat(p.price.replace(',', '.')) || 0;
            storeGroups[storeName].totalPrice += priceFloat;
            
            // AGORA SALVAMOS O OBJETO COMPLETO, NÃO SÓ UMA STRING
            storeGroups[storeName].foundItems.push({
                name: p.name,
                price: p.price,
                description: p.description // <--- Enviamos a descrição para o frontend
            });
        });

        const ranking = Object.values(storeGroups).sort((a, b) => a.totalPrice - b.totalPrice);
        res.json(ranking);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao comparar' });
    }
});


app.listen(PORT, () => console.log(`🔥 Servidor com Descrição rodando na porta ${PORT}`));


// 🔹 Servir Angular
app.use(express.static(path.join(__dirname, 'public')));

