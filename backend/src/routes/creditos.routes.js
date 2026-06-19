const router = require('express').Router();
const ctrl = require('../controllers/creditos.controller');
const auth = require('../middlewares/auth.middleware');
const verificarRol = require('../middlewares/roles.middleware');

router.post('/', auth, verificarRol(['ADMIN', 'VENDEDOR']), ctrl.crearCredito);
router.get('/', auth, verificarRol(['ADMIN', 'VENDEDOR', 'CAJERO']), ctrl.listarCreditos);
router.get('/:id', auth, ctrl.obtenerCredito);
router.get('/:id/pagos', auth, ctrl.listarPagos);
router.post('/:id/abonos', auth, verificarRol(['ADMIN', 'CAJERO']), ctrl.registrarAbono);

module.exports = router;
