const router = require('express').Router();
const ctrl = require('../controllers/inventario.controller');
const auth = require('../middlewares/auth.middleware');
const verificarRol = require('../middlewares/roles.middleware');

router.get('/', auth, ctrl.listarMovimientos);
router.post('/movimientos', auth, verificarRol(['ADMIN', 'BODEGA']), ctrl.crearMovimiento);

module.exports = router;
