const cosmosService = require('../services/cosmosService');
const getDb = require('../database');

exports.searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 3) {
            return res.status(400).json({ error: 'Digite pelo menos 3 caracteres.' });
        }

        const data = await cosmosService.searchByName(q);
        
        // Padronizando o retorno (limpando o excesso de dados da API)
        // A Cosmos retorna os produtos num array
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
        const { gtin, price, stock } = req.body;

        if (!gtin || price === undefined || stock === undefined) {
            return res.status(400).json({ error: 'GTIN, preço e estoque são obrigatórios.' });
        }

        const db = await getDb();

        // 1. Verifica se já existe (Evita duplicados)
        const existing = await db.get('SELECT * FROM products WHERE gtin = ?', [gtin]);
        if (existing) {
            return res.status(409).json({ error: 'Este produto (GTIN) já está cadastrado no seu sistema.' });
        }

        // 2. Busca os dados reais na Bluesoft
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

        // 3. Salva no nosso SQLite
        const result = await db.run(
            `INSERT INTO products (gtin, name, brand, ncm, price, stock) VALUES (?, ?, ?, ?, ?, ?)`,
            [gtin, name, brand, ncm, price, stock]
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