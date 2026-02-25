const cosmosService = require('../services/cosmosService');
const getDb = require('../database');

exports.searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 3) {
            return res.status(400).json({ error: 'Digite pelo menos 3 caracteres.' });
        }

        const data = await cosmosService.searchByName(q);
        
        const results = (Array.isArray(data) ? data : []).map(item => ({
            gtin: item.gtin,
            description: item.description,
            brand: item.brand ? item.brand.name : null,
            ncm: item.ncm ? item.ncm.code : null
        }));

        res.json(results);
    } catch (error) {
        console.error("Erro no Cosmos Search:", error.message);
        res.status(500).json({ error: 'Erro ao consultar a API Cosmos.' });
    }
};

exports.createFromGtin = async (req, res) => {
    try {
        const { gtin, price, stock, ownerId } = req.body; // <-- Adicionamos ownerId

        if (!gtin || price === undefined || stock === undefined || !ownerId) {
            return res.status(400).json({ error: 'GTIN, preço, estoque e ID do Vendedor são obrigatórios.' });
        }

        const db = await getDb();

        const existing = await db.get('SELECT * FROM Products WHERE gtin = ? AND ownerId = ?', [gtin, ownerId]);
        if (existing) {
            return res.status(409).json({ error: 'Você já cadastrou este produto (GTIN) no seu mercado.' });
        }

        let cosmosData;
        try {
            cosmosData = await cosmosService.getByGtin(gtin);
        } catch (apiError) {
            if (apiError.response && apiError.response.status === 404) {
                return res.status(404).json({ error: 'Produto não encontrado na base de dados da Cosmos.' });
            }
            throw apiError;
        }

        const name = cosmosData.description;
        const brand = cosmosData.brand ? cosmosData.brand.name : 'Genérico';
        const ncm = cosmosData.ncm ? cosmosData.ncm.code : null;

        // Inserindo na tabela Products (A mesma que o comparador usa)
        const result = await db.run(
            `INSERT INTO Products (gtin, name, brand, ncm, price, stock, category, status, ownerId, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, 'Geral', 'Ativo', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [gtin, name, brand, ncm, price.toString(), stock, ownerId]
        );

        res.status(201).json({
            success: true,
            message: 'Produto importado e cadastrado com sucesso!',
            product: { id: result.lastID, gtin, name, brand, price, stock }
        });

    } catch (error) {
        console.error("Erro ao salvar produto:", error.message);
        res.status(500).json({ error: 'Erro interno ao processar o cadastro.' });
    }
};