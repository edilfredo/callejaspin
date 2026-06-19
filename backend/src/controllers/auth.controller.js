const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { nombres, apellidos, email, password, rol } = req.body;

    if (!nombres || !apellidos || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Todos los campos son obligatorios' });
    }

    const { data: existente } = await supabase
      .from('usuarios').select('id').eq('email', email).single();

    if (existente) {
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nombres, apellidos, email, password: hash, rol: rol || 'VENDEDOR' }])
      .select('id, nombres, apellidos, email, rol, created_at');

    if (error) return res.status(400).json({ ok: false, mensaje: 'Error al registrar', error: error.message });

    res.status(201).json({ ok: true, mensaje: 'Usuario registrado', data: data[0] });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Email y contraseña requeridos' });
    }

    const { data: user, error } = await supabase
      .from('usuarios').select('*').eq('email', email).single();

    if (error || !user) {
      return res.status(404).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    if (!user.estado) {
      return res.status(403).json({ ok: false, mensaje: 'Cuenta desactivada' });
    }

    const valido = await bcrypt.compare(password, user.password);
    if (!valido) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, tipo: 'usuario' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso',
      data: {
        token,
        usuario: {
          id: user.id, nombres: user.nombres, apellidos: user.apellidos,
          email: user.email, rol: user.rol
        }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.loginUnificado = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Email y contraseña requeridos' });
    }

    const { data: user } = await supabase
      .from('usuarios').select('*').eq('email', email).single();

    if (user) {
      if (!user.estado) {
        return res.status(403).json({ ok: false, mensaje: 'Cuenta desactivada' });
      }
      const valido = await bcrypt.compare(password, user.password);
      if (!valido) {
        return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
      }
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol, tipo: 'usuario' },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({
        ok: true, tipo: 'usuario',
        data: { token, usuario: { id: user.id, nombres: user.nombres, apellidos: user.apellidos, email: user.email, rol: user.rol } }
      });
    }

    const { data: cliente } = await supabase
      .from('clientes').select('*').eq('email', email).single();

    if (cliente) {
      if (!cliente.password) {
        return res.status(403).json({ ok: false, mensaje: 'Cliente sin contraseña. Contacte al administrador.' });
      }
      const valido = await bcrypt.compare(password, cliente.password);
      if (!valido) {
        return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
      }
      const token = jwt.sign(
        { id: cliente.id, email: cliente.email, rol: 'CLIENTE', tipo: 'cliente' },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({
        ok: true, tipo: 'cliente',
        data: { token, cliente: { id: cliente.id, cedula: cliente.cedula, nombres: cliente.nombres, apellidos: cliente.apellidos, email: cliente.email, telefono: cliente.telefono } }
      });
    }

    return res.status(404).json({ ok: false, mensaje: 'Credenciales inválidas' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.loginCliente = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Email y contraseña requeridos' });
    }

    const { data: cliente, error } = await supabase
      .from('clientes').select('*').eq('email', email).single();

    if (error || !cliente) {
      return res.status(404).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    if (!cliente.password) {
      return res.status(403).json({ ok: false, mensaje: 'El cliente no tiene contraseña. Contacte al administrador.' });
    }

    const valido = await bcrypt.compare(password, cliente.password);
    if (!valido) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, rol: 'CLIENTE', tipo: 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso',
      data: {
        token,
        cliente: {
          id: cliente.id, cedula: cliente.cedula, nombres: cliente.nombres,
          apellidos: cliente.apellidos, email: cliente.email, telefono: cliente.telefono
        }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
