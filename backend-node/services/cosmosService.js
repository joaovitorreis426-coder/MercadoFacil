const axios = require('axios');
require('dotenv').config();

const cosmosApi = axios.create({
    baseURL: 'https://api.cosmos.bluesoft.com.br',
    headers: {
        'X-Cosmos-Token': process.env.COSMOS_TOKEN,
        'Content-Type': 'application/json'
    }
});

exports.searchByName = async (query) => {
    // A API Cosmos pede o parâmetro 'query'
    const response = await cosmosApi.get(`/products?query=${encodeURIComponent(query)}`);
    return response.data; 
};

exports.getByGtin = async (gtin) => {
    const response = await cosmosApi.get(`/gtins/${gtin}.json`);
    return response.data;
};