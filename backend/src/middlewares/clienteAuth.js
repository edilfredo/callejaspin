const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado', error: 'Token no proporcionado' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.tipo !== 'cliente') {
      return res.status(403).json({ ok: false, mensaje: 'Acceso denegado', error: 'Token no es de cliente' });
    }
    req.cliente = decoded;
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado', error: 'Token inválido o expirado' });
  }
};
