const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const axios = require('axios'); // Necessário: npm install axios

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração básica
app.use(cors());
app.use(bodyParser.json());

// Banco de Dados (SQLite)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// --- MODELOS ---

// 1. Usuário (Cliente e Vendedor)
const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'consumer' }, // 'consumer' ou 'seller'
    // Campos exclusivos do Vendedor
    storeName: { type: DataTypes.STRING },
    storeType: { type: DataTypes.STRING },
    lat: { type: DataTypes.FLOAT },
    lng: { type: DataTypes.FLOAT }
});

// 2. Produto (Agora com GTIN!)
const Product = sequelize.define('Product', {
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'Ativo' }, // Ativo, Esgotado
    image: { type: DataTypes.STRING },
    gtin: { type: DataTypes.STRING }, // <--- CAMPO NOVO
    ownerId: { type: DataTypes.INTEGER } // ID do Vendedor que criou
});

// 3. Lista de Compras
const ShoppingList = sequelize.define('ShoppingList', {
    name: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING },
    frequency: { type: DataTypes.STRING },
    items: { type: DataTypes.JSON }, // Array de strings salvo como JSON
    ownerId: { type: DataTypes.INTEGER }
});

// Relacionamentos
User.hasMany(Product, { foreignKey: 'ownerId' });
Product.belongsTo(User, { foreignKey: 'ownerId' });

// --- ROTAS ---

// Rota de Teste
app.get('/', (req, res) => res.send('API Mercado Fácil Rodando 🚀'));

// 1. Autenticação (Login/Registro simplificado)
app.post('/api/auth/register', async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.json(user);
    } catch (e) { res.status(500).json({ error: 'Erro ao criar conta' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, password } });
    if (user) res.json(user);
    else res.status(401).json({ error: 'Dados inválidos' });
});

app.put('/api/user/update-profile', async (req, res) => {
    try {
        const { email, ...updates } = req.body;
        await User.update(updates, { where: { email } });
        const updatedUser = await User.findOne({ where: { email } });
        res.json({ success: true, user: updatedUser });
    } catch (e) { res.status(500).json({ error: 'Erro ao atualizar' }); }
});

// 2. Produtos (CRUD)
app.get('/api/products', async (req, res) => {
    const { ownerId } = req.query;
    const where = ownerId ? { ownerId } : {};
    const products = await Product.findAll({ where });
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.json(product);
    } catch (e) { res.status(500).json({ error: 'Erro ao criar produto' }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        await Product.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Erro ao atualizar' }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Erro ao deletar' }); }
});

app.get('/api/products/search', async (req, res) => {
    const { q } = req.query;
    const products = await Product.findAll({
        where: { name: { [Op.like]: `%${q}%` }, status: 'Ativo' },
        limit: 10
    });
    // Retorna nomes únicos para o autocomplete
    const uniqueNames = [...new Set(products.map(p => p.name))];
    res.json(uniqueNames);
});

// 3. Listas de Compras
app.get('/api/lists', async (req, res) => {
    const { ownerId } = req.query;
    const lists = await ShoppingList.findAll({ where: { ownerId } });
    // Converte de volta de JSON string para Array
    const parsedLists = lists.map(l => {
        const list = l.toJSON();
        list.items = typeof list.items === 'string' ? JSON.parse(list.items) : list.items;
        return list;
    });
    res.json(parsedLists);
});

app.post('/api/lists', async (req, res) => {
    try {
        const { items, ...rest } = req.body;
        await ShoppingList.create({ ...rest, items: JSON.stringify(items) });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Erro ao salvar lista' }); }
});

app.put('/api/lists/:id', async (req, res) => {
    try {
        const { items, ...rest } = req.body;
        await ShoppingList.update({ ...rest, items: JSON.stringify(items) }, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Erro ao atualizar lista' }); }
});

app.delete('/api/lists/:id', async (req, res) => {
    await ShoppingList.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
});

// 4. GTIN (Busca Código de Barras)
app.get('/api/gtin/:code', async (req, res) => {
    const { code } = req.params;
    try {
        // API Pública Open Food Facts
        const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const data = response.data;

        if (data.status === 1) {
            res.json({
                found: true,
                name: data.product.product_name || data.product.product_name_pt || '',
                image: data.product.image_url || ''
            });
        } else {
            res.json({ found: false });
        }
    } catch (error) {
        console.error('Erro GTIN:', error.message);
        res.status(500).json({ error: 'Erro na busca' });
    }
});

// 5. Comparador Inteligente (GPS + Preço + Quantidade)
app.post('/api/compare', async (req, res) => {
    try {
        const { shoppingList, userLat, userLng } = req.body;
        if (!shoppingList || shoppingList.length === 0) return res.json([]);

        // Busca todos os produtos ativos e seus donos (lojas)
        const allProducts = await Product.findAll({
            where: { status: 'Ativo' },
            include: User
        });

        // Normaliza para comparar strings (sem acentos, minúsculo)
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const normalizedList = shoppingList.map(i => normalize(i));

        // Filtra quais produtos do banco batem com a lista
        const matched = allProducts.filter(p => {
            const pName = normalize(p.name);
            return normalizedList.some(item => pName.includes(item));
        });

        // Agrupa por Loja
        const storeGroups = {};

        matched.forEach(p => {
            if (!p.User) return;
            const storeName = p.User.storeName || 'Loja Sem Nome';
            
            if (!storeGroups[storeName]) {
                let dist = null;
                // Calcula distância se tivermos os dois pontos (Cliente e Loja)
                if (userLat && userLng && p.User.lat && p.User.lng) {
                    dist = getDistanceFromLatLonInKm(userLat, userLng, p.User.lat, p.User.lng);
                }

                storeGroups[storeName] = {
                    storeName,
                    totalPrice: 0,
                    foundItems: [],
                    distance: dist
                };
            }

            const priceVal = parseFloat(p.price.replace(',', '.')) || 0;
            storeGroups[storeName].totalPrice += priceVal;
            storeGroups[storeName].foundItems.push({
                name: p.name,
                price: p.price
            });
        });

        // Ordenação Inteligente: 
        // 1º Quem tem mais itens
        // 2º Quem é mais perto (se tiver GPS)
        // 3º Quem é mais barato
        const ranking = Object.values(storeGroups).sort((a, b) => {
            const diffItems = b.foundItems.length - a.foundItems.length;
            if (diffItems !== 0) return diffItems;

            if (a.distance !== null && b.distance !== null) {
                const diffDist = a.distance - b.distance;
                if (Math.abs(diffDist) > 2.0) return diffDist; // Prioriza distância se diferença > 2km
            }

            return a.totalPrice - b.totalPrice;
        });

        // Retorna TOP 4
        res.json(ranking.slice(0, 4));

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao comparar' });
    }
});

// Função Auxiliar de Distância (Haversine)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = deg2rad(lat2-lat1);  
    const dLon = deg2rad(lon2-lon1); 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return parseFloat((R * c).toFixed(1));
}
function deg2rad(deg) { return deg * (Math.PI/180); }

// Iniciar Servidor
sequelize.sync().then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
});