const router = require('express').Router();
const ctrl = require('../controllers/plan_separe.controller');
const auth = require('../middlewares/auth.middleware');
const verificarRol = require('../middlewares/roles.middleware');

router.post('/', auth, verificarRol(['ADMIN', 'VENDEDOR']), ctrl.crearPlan);
router.get('/', auth, verificarRol(['ADMIN', 'VENDEDOR', 'CAJERO']), ctrl.listarPlanes);
router.get('/:id', auth, ctrl.obtenerPlan);
router.post('/:id/abonos', auth, verificarRol(['ADMIN', 'CAJERO']), ctrl.registrarAbono);

module.exports = router;
