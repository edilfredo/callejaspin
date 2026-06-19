const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middlewares/auth.middleware');
const verificarRol = require('../middlewares/roles.middleware');

router.get('/', auth, verificarRol(['ADMIN', 'VENDEDOR']), dashboardController.resumen);
router.get('/evolucion-mensual', auth, verificarRol(['ADMIN', 'VENDEDOR']), dashboardController.evolucionMensual);

module.exports = router;
