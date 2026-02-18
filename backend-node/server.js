const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

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

// 3. ROTAS DE AUTENTICAÇÃO
app.post('/api/auth/register', async (req, res) => {
    try { 
        const user = await User.create(req.body); 
        res.json(user); 
    } catch (e) { 
        console.error("Erro no Registro:", e);
        res.status(500).json({ error: 'Erro ao criar conta' }); 
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.body.email, password: req.body.password } });
        if (user) res.json(user); else res.status(401).json({ error: 'Dados inválidos' });
    } catch(e) {
        console.error("Erro no Login:", e);
        res.status(500).json({ error: 'Erro no login' });
    }
});

// 4. ROTA DE ATUALIZAR PERFIL (A que estava dando erro)
app.put('/api/user/update-profile', async (req, res) => {
    try {
        const { email, storeName, storeType, lat, lng } = req.body;
        
        // Se o email não vier, barra logo de cara
        if(!email) return res.status(400).json({error: "Email não fornecido pelo painel."});

        // Atualiza a loja
        await User.update(
            { storeName, storeType, lat, lng }, 
            { where: { email: email } }
        );
        
        // Pega os dados atualizados
        const user = await User.findOne({ where: { email: email } });
        
        if(user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    } catch (e) { 
        console.error("Erro no Perfil:", e);
        // 👇 Agora ele vai mandar o erro original e cru do Banco de Dados para a sua tela!
        res.status(500).json({ error: e.message || e.toString() }); 
    }
});

// 5. ROTAS DE PRODUTOS
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

// 6. ROTAS DE LISTAS DE COMPRAS
app.get('/api/lists', async (req, res) => {
    const lists = await ShoppingList.findAll({ where: { ownerId: req.query.ownerId } });
    res.json(lists.map(l => { const j = l.toJSON(); j.items = typeof j.items === 'string' ? JSON.parse(j.items) : j.items; return j; }));
});

app.post('/api/lists', async (req, res) => { await ShoppingList.create({ ...req.body, items: JSON.stringify(req.body.items) }); res.json({ success: true }); });
app.put('/api/lists/:id', async (req, res) => { await ShoppingList.update({ ...req.body, items: JSON.stringify(req.body.items) }, { where: { id: req.params.id } }); res.json({ success: true }); });
app.delete('/api/lists/:id', async (req, res) => { await ShoppingList.destroy({ where: { id: req.params.id } }); res.json({ success: true }); });

// 7. MOTOR DE COMPARAÇÃO DE PREÇOS
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

      // O Cérebro do Ranking: Quantidade > Preço > Distância
        const ranking = Object.values(stores).sort((a, b) => {
            // 1º Regra: Quem tem mais produtos da lista ganha
            if (b.foundItems.length !== a.foundItems.length) {
                return b.foundItems.length - a.foundItems.length;
            }
            
            // 2º Regra: Se empataram na quantidade, o mais BARATO ganha
            if (a.totalPrice !== b.totalPrice) {
                return a.totalPrice - b.totalPrice;
            }
            
            // 3º Regra: Se empataram na quantidade e no preço, o mais PERTO ganha
            if (a.distance && b.distance) {
                return a.distance - b.distance;
            }
            
            return 0; // Se tudo for exatamente igual, mantém a ordem
        });
    } catch(e) { res.status(500).json({ error: 'Erro' }); }
});

// Fórmulas de Distância GPS
function getDistance(lat1,lon1,lat2,lon2) {
  const R=6371, dLat=d2r(lat2-lat1), dLon=d2r(lon2-lon1); 
  const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(d2r(lat1))*Math.cos(d2r(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2); 
  return parseFloat((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1));
}
function d2r(d) { return d*(Math.PI/180); }

// Ligar o Servidor (Com alter:true para não apagar os dados sozinhos)
sequelize.sync({ alter: true }).then(() => app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`)));