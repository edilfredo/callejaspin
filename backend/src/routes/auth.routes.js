const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/cliente-login', authController.loginCliente);
router.post('/login-unificado', authController.loginUnificado);

module.exports = router;
