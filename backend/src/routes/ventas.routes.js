const router = require('express').Router();
const ctrl = require('../controllers/ventas.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/', auth, ctrl.crearVenta);
router.get('/', auth, ctrl.listarVentas);
router.get('/:id', auth, ctrl.obtenerVenta);
router.put('/:id/anular', auth, ctrl.anularVenta);

module.exports = router;
