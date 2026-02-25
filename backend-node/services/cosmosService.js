// SIMULADOR (MOCK) - Substitui a API da Bluesoft para evitar o Erro 429
const mockDatabase = [
    { gtin: "7891167000044", description: "Arroz Branco Tio João 1kg", brand: { name: "Tio João" }, ncm: { code: "10063021" } },
    { gtin: "7896006711116", description: "Arroz Parboilizado Camil 1kg", brand: { name: "Camil" }, ncm: { code: "10063011" } },
    { gtin: "7891010000000", description: "Feijão Carioca Kicaldo 1kg", brand: { name: "Kicaldo" }, ncm: { code: "07133319" } },
    { gtin: "7894900011517", description: "Refrigerante Coca-Cola 2L", brand: { name: "Coca-Cola" }, ncm: { code: "22021000" } },
    { gtin: "7891000053508", description: "Leite Condensado Moça 395g", brand: { name: "Nestlé" }, ncm: { code: "19019020" } },
    { gtin: "7891515000000", description: "Óleo de Soja Soya 900ml", brand: { name: "Soya" }, ncm: { code: "15079011" } },
    { gtin: "7891962000000", description: "Açúcar Refinado União 1kg", brand: { name: "União" }, ncm: { code: "17019900" } },
    { gtin: "7891000043943", description: "Café Torrado e Moído Pilão 500g", brand: { name: "Pilão" }, ncm: { code: "09012100" } }
];

exports.searchByName = async (query) => {
    // Normaliza o texto (tira acentos e coloca em minúsculas)
    const term = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Filtra no nosso banco simulado
    return mockDatabase.filter(item => {
        const desc = item.description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return desc.includes(term);
    });
};

exports.getByGtin = async (gtin) => {
    const product = mockDatabase.find(item => item.gtin === String(gtin));
    if (!product) {
        const error = new Error('Not Found');
        error.response = { status: 404 };
        throw error;
    }
    return product;
};