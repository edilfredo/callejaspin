const router = require('express').Router();
const ctrl = require('../controllers/pagos.controller');
const auth = require('../middlewares/auth.middleware');
const verificarRol = require('../middlewares/roles.middleware');

router.get('/', auth, verificarRol(['ADMIN', 'CAJERO', 'VENDEDOR']), ctrl.listar);
router.get('/pendientes', auth, verificarRol(['ADMIN', 'CAJERO', 'VENDEDOR']), ctrl.listarPendientes);
router.get('/:id', auth, ctrl.obtener);
router.post('/', auth, verificarRol(['ADMIN', 'CAJERO']), ctrl.crear);
router.post('/efectivo', auth, verificarRol(['ADMIN', 'CAJERO']), ctrl.registrarEfectivo);
router.put('/:id/aprobar', auth, verificarRol(['ADMIN', 'CAJERO']), ctrl.aprobarPago);
router.put('/:id/rechazar', auth, verificarRol(['ADMIN', 'CAJERO']), ctrl.rechazarPago);

module.exports = router;
