const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/search', productController.searchProducts);
router.post('/create-from-gtin', productController.createFromGtin);

module.exports = router;