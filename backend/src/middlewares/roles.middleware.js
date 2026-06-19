const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        mensaje: 'No autorizado',
        error: 'Debe autenticarse primero'
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: 'Acceso denegado',
        error: `Se requiere rol: ${rolesPermitidos.join(' o ')}`
      });
    }

    next();
  };
};

module.exports = verificarRol;
