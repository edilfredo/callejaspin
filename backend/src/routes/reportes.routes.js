const router = require('express').Router();
const reportesController = require('../controllers/reportes.controller');
const auth = require('../middlewares/auth.middleware');
const verificarRol = require('../middlewares/roles.middleware');

router.get('/ventas', auth, verificarRol(['ADMIN', 'VENDEDOR']), reportesController.ventasPorPeriodo);
router.get('/productos-mas-vendidos', auth, verificarRol(['ADMIN', 'VENDEDOR']), reportesController.productosMasVendidos);
router.get('/clientes-frecuentes', auth, verificarRol(['ADMIN', 'VENDEDOR']), reportesController.clientesFrecuentes);
router.get('/inventario-valorizado', auth, verificarRol(['ADMIN', 'BODEGA']), reportesController.inventarioValorizado);

module.exports = router;
