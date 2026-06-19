const router = require('express').Router();
const ctrl = require('../controllers/categoria.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/', auth, ctrl.crear);
router.get('/', auth, ctrl.listar);
router.get('/:id', auth, ctrl.obtener);
router.put('/:id', auth, ctrl.actualizar);
router.delete('/:id', auth, ctrl.eliminar);

module.exports = router;
