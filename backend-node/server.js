const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes, Op } = require('sequelize');
const fs = require('fs'); // Biblioteca de arquivos do sistema

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- 🛑 ZONA DE LIMPEZA DE EMERGÊNCIA (SOLUÇÃO PRO RENDER) ---
// Esse bloco verifica se o banco existe e APAGA ele antes de conectar.
// Isso resolve o erro de "Foreign Key Constraint" travada.
try {
    const dbPath = './database.sqlite';
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('🗑️ BANCO DE DADOS TRAVADO FOI DELETADO COM SUCESSO! INICIANDO LIMPO.');
    }
} catch (err) {
    console.error('Erro ao tentar limpar o banco:', err);
}
// -------------------------------------------------------------

// --- BANCO DE DADOS ---
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

Product.belongsTo(User, { foreignKey: 'ownerId' });

// Sincroniza criando as tabelas do zero
sequelize.sync({ force: true }).then(() => console.log('💾 Banco Novo Criado e Pronto!'));

function normalizeString(str) {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// --- ROTAS ---

// 1. Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, type } = req.body;
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ message: 'Email já cadastrado' });
        
        const newUser = await User.create({ name, email, password, type });
        res.json({ success: true, user: newUser });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: 'Erro no registro' }); 
    }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, type } = req.body;
        const user = await User.findOne({ where: { email, password, type } });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ message: 'Dados incorretos' });
    } catch (e) { res.status(500).json({ error: 'Erro no login' }); }
});

// 3. ATUALIZAR PERFIL (COM AUTO-CURA)
app.put('/api/user/update-profile', async (req, res) => {
    const { email, storeName, storeType, lat, lng } = req.body;
    console.log(`📡 Atualizando perfil para: ${email}`);

    try {
        let user = await User.findOne({ where: { email } });
        
        // SE NÃO EXISTIR, CRIA NA HORA (Evita erro 404)
        if (!user) {
            console.log('⚠️ Usuário fantasma detectado! Recriando automaticamente...');
            user = await User.create({
                email: email,
                name: 'Loja Recuperada',
                password: '123', 
                type: 'seller',
                storeName: storeName,
                storeType: storeType,
                lat: lat,
                lng: lng
            });
            console.log('✅ Usuário recuperado criado!');
            return res.json({ success: true, user });
        }

        user.storeName = storeName;
        user.storeType = storeType;
        if (lat) user.lat = lat;
        if (lng) user.lng = lng;
        await user.save();
        res.json({ success: true, user });

    } catch (error) {
        console.error('Erro ao atualizar:', error);
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

// 5. Produtos CRUD
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
        const ownerId = parseInt(req.body.ownerId); 
        const owner = await User.findByPk(ownerId);
        
        // Se o dono não existe (porque o banco resetou), recria um usuário temporário ou avisa
        if (!owner) {
             return res.status(404).json({ error: 'Erro de sessão. Faça logout e login novamente.' });
        }

        const prod = await Product.create({ ...req.body, ownerId });
        res.json(prod);
    } catch (e) { 
        console.error("Erro criar produto:", e);
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

// 6. Busca Autocomplete
app.get('/api/products/search', async (req, res) => {
    try {
        const { q } = req.query; 
        if (!q || q.length < 2) return res.json([]);
        
        // Só busca produtos ATIVOS na sugestão também
        const allProducts = await Product.findAll({ 
            where: { status: 'Ativo' },
            attributes: ['name'] 
        });
        
        const filtered = allProducts
            .filter(p => normalizeString(p.name).includes(normalizeString(q)))
            .map(p => p.name);
        res.json([...new Set(filtered)].slice(0, 10));
    } catch (error) { res.status(500).json([]); }
});

// 7. Comparar Preços (LÓGICA NOVA: Prioriza quem tem mais itens)
app.post('/api/compare', async (req, res) => {
    try {
        const { shoppingList } = req.body;
        if (!shoppingList || shoppingList.length === 0) return res.json([]);

        // Busca apenas produtos ATIVOS
        const allProducts = await Product.findAll({ 
            where: { status: 'Ativo' }, 
            include: User 
        });

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
            storeGroups[storeName].foundItems.push({
                name: p.name,
                price: p.price,
                description: p.description,
                category: p.category
            });
        });

        // --- A MÁGICA ACONTECE AQUI ---
        const ranking = Object.values(storeGroups).sort((a, b) => {
            // 1. Critério: Quantidade de Itens (Quem tem MAIS vem primeiro)
            // Se B tem 10 e A tem 5 -> (10 - 5) é positivo, então B ganha.
            const diferencaItens = b.foundItems.length - a.foundItems.length;

            // Se a diferença não for zero, ordena por quantidade
            if (diferencaItens !== 0) {
                return diferencaItens;
            }

            // 2. Critério: Preço (Quem é MAIS BARATO vem primeiro)
            // Só chega aqui se os dois tiverem a mesma quantidade de itens
            return a.totalPrice - b.totalPrice;
        });
        // ------------------------------

        res.json(ranking);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao comparar' });
    }
});
    
// Isso vai apagar o banco velho e recriar um novo, limpinho e com as regras corretas
sequelize.sync({ force: true }).then(() => {
    app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
});
