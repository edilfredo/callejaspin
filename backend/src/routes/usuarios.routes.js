const router = require('express').Router();
const ctrl = require('../controllers/usuarios.controller');
const auth = require('../middlewares/auth.middleware');
const verificarRol = require('../middlewares/roles.middleware');

router.post('/', auth, verificarRol(['ADMIN']), ctrl.crear);
router.get('/', auth, verificarRol(['ADMIN']), ctrl.listar);
router.get('/:id', auth, verificarRol(['ADMIN']), ctrl.obtener);
router.put('/:id', auth, verificarRol(['ADMIN']), ctrl.actualizar);
router.delete('/:id', auth, verificarRol(['ADMIN']), ctrl.eliminar);

module.exports = router;
