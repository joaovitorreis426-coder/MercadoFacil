const axios = require('axios');
require('dotenv').config();

// Configuração do Axios para a Bluesoft
const cosmosApi = axios.create({
    baseURL: 'https://api.cosmos.bluesoft.com.br',
    headers: {
        'X-Cosmos-Token': process.env.COSMOS_TOKEN,
        'Content-Type': 'application/json',
        'User-Agent': 'Cosmos-API-Request' // Algumas APIs exigem User-Agent
    }
});

exports.searchByName = async (query) => {
    try {
        console.log(`🔍 Iniciando busca na Bluesoft para: "${query}"`);
        
        // A Bluesoft usa o parâmetro 'query' para busca por nome
        const response = await cosmosApi.get('/products', {
            params: { query: query }
        });

        console.log(`✅ Resposta recebida! Status: ${response.status}`);
        console.log(`📦 Dados retornados:`, JSON.stringify(response.data).substring(0, 200) + "...");

        // A Bluesoft geralmente retorna um Array diretamente ou dentro de um objeto
        // Vamos garantir que retornamos um array para o Frontend não quebrar
        return Array.isArray(response.data) ? response.data : (response.data.products || []);

    } catch (error) {
        console.error("❌ Erro na chamada da API Cosmos:");
        if (error.response) {
            // O servidor respondeu com um status fora do range 2xx
            console.error("Status:", error.response.status);
            console.error("Mensagem da API:", error.response.data);
        } else {
            // Erro de rede ou configuração
            console.error("Mensagem de erro:", error.message);
        }
        throw error;
    }
};

exports.getByGtin = async (gtin) => {
    try {
        console.log(`🔍 Buscando GTIN: ${gtin}`);
        const response = await cosmosApi.get(`/gtins/${gtin}.json`);
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao buscar GTIN ${gtin}:`, error.message);
        throw error;
    }
};