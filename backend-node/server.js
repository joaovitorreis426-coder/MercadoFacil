const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- BANCO DE DADOS ---
// O 'alter: true' garante que tabelas sejam atualizadas sem precisar apagar o arquivo
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// --- MODELOS ---
const User = sequelize.define('User', {
    _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true }, // Email deve ser único
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

Product.belongsTo(User, { foreignKey: 'ownerId' });

// ATENÇÃO: 'force: true' apaga os dados antigos para recriar as tabelas sem erros
sequelize.sync({ alter: true }).then(() => console.log('💾 Banco RESETADO e Pronto!'));

function normalizeString(str) {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// --- ROTAS ---

// 1. Registro
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, type } = req.body;
        // Tenta achar antes para não dar erro de SQL
        const existing = await User.findOne({ where: { email } });
        if (existing) {
             return res.status(400).json({ message: 'Email já cadastrado' });
        }
        
        const newUser = await User.create({ name, email, password, type });
        res.json({ success: true, user: newUser });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: 'Erro no registro' }); 
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, type } = req.body;
        const user = await User.findOne({ where: { email, password, type } });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ message: 'Dados incorretos' });
    } catch (e) { res.status(500).json({ error: 'Erro no login' }); }
});

// 3. ATUALIZAR PERFIL (COM AUTO-CURA - AQUI ESTÁ A SOLUÇÃO)
app.put('/api/user/update-profile', async (req, res) => {
    const { email, storeName, storeType, lat, lng } = req.body;
    console.log(`📡 Atualizando perfil para: ${email}`);

    try {
        let user = await User.findOne({ where: { email } });
        
        // --- INÍCIO DA SOLUÇÃO MÁGICA ---
        if (!user) {
            console.log('⚠️ Usuário não encontrado! Criando um novo automaticamente (Auto-Healing)...');
            // Se o usuário não existe (fantasma), CRIA ELE AGORA
            user = await User.create({
                email: email,
                name: 'Usuario Recuperado',
                password: '123', // Senha provisória, já que o login front está validado
                type: 'seller',
                storeName: storeName,
                storeType: storeType,
                lat: lat,
                lng: lng
            });
            console.log('✅ Usuário Auto-Recuperado Criado!');
            return res.json({ success: true, user });
        }
        // --- FIM DA SOLUÇÃO MÁGICA ---

        // Se o usuário já existia, só atualiza normal
        user.storeName = storeName;
        user.storeType = storeType;
        if (lat) user.lat = lat;
        if (lng) user.lng = lng;
        await user.save();
        
        res.json({ success: true, user });

    } catch (error) {
        console.error('Erro grave:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// 4. Buscar Vendedores
app.get('/api/sellers', async (req, res) => {
    const sellers = await User.findAll({ 
        where: { type: 'seller', storeName: { [Op.ne]: null } },
        attributes: ['storeName', 'storeType', 'lat', 'lng', 'email']
    });
    res.json(sellers);
});

// 5. Produtos
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
        // Garante que o ID do dono é um número
        const ownerId = parseInt(req.body.ownerId); 
        
        // Verifica se esse dono existe mesmo
        const owner = await User.findByPk(ownerId);
        if (!owner) {
            return res.status(404).json({ error: 'Dono do produto não encontrado. Faça logout e login.' });
        }

        const prod = await Product.create({ ...req.body, ownerId });
        res.json(prod);
    } catch (e) { 
        console.error("Erro ao criar produto:", e);
        res.status(500).json({ error: 'Erro ao criar' }); 
    }
});

app.put('/api/products/:id', async (req, res) => {
    await Product.update(req.body, { where: { _id: req.params.id } });
    res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
    await Product.destroy({ where: { _id: req.params.id } });
    res.json({ success: true });
});

// 6. Busca
app.get('/api/products/search', async (req, res) => {
    try {
        const { q } = req.query; 
        if (!q || q.length < 2) return res.json([]);
        const allProducts = await Product.findAll({ attributes: ['name'] });
        const filtered = allProducts
            .filter(p => normalizeString(p.name).includes(normalizeString(q)))
            .map(p => p.name);
        res.json([...new Set(filtered)].slice(0, 10));
    } catch (error) { res.status(500).json([]); }
});

// 7. Comparar
app.post('/api/compare', async (req, res) => {
    try {
        const { shoppingList } = req.body;
        if (!shoppingList || shoppingList.length === 0) return res.json([]);

        // --- A MUDANÇA ESTÁ AQUI EMBAIXO ---
        const allProducts = await Product.findAll({ 
            where: { status: 'Ativo' }, // <--- FILTRO MÁGICO: Ignora os esgotados
            include: User 
        });
        // ------------------------------------

        const normalizedList = shoppingList.map(item => normalizeString(item));

        const matchedProducts = allProducts.filter(p => {
            const pName = normalizeString(p.name);
            return normalizedList.some(item => pName.includes(item));
        });

        const storeGroups = {};

        matchedProducts.forEach(p => {
            // Verifica se tem dono da loja (para não quebrar se o usuário foi deletado)
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
            storeGroups[storeName].foundItems.push({
                name: p.name,
                price: p.price,
                description: p.description,
                category: p.category
            });
        });

        const ranking = Object.values(storeGroups).sort((a, b) => a.totalPrice - b.totalPrice);
        res.json(ranking);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao comparar' });
    }
});
app.listen(PORT, () => console.log(`🔥 Servidor rodando na porta ${PORT}`));