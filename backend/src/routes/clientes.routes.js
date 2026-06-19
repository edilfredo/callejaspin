const router = require('express').Router();
const ctrl = require('../controllers/clientes.controller');
const pagosClienteCtrl = require('../controllers/pagosCliente.controller');
const auth = require('../middlewares/auth.middleware');
const clienteAuth = require('../middlewares/clienteAuth');
const upload = require('../utils/upload');

router.post('/', auth, ctrl.crear);
router.get('/', auth, ctrl.listar);

router.post('/pagos', clienteAuth, upload.single('comprobante'), pagosClienteCtrl.solicitarPago);
router.get('/pagos', clienteAuth, pagosClienteCtrl.misPagos);

router.get('/:id', auth, ctrl.obtener);
router.get('/:id/mis-datos', clienteAuth, ctrl.misDatos);
router.get('/:id/creditos', auth, ctrl.obtenerCreditosCliente);
router.put('/:id', auth, ctrl.actualizar);
router.delete('/:id', auth, ctrl.eliminar);

module.exports = router;
