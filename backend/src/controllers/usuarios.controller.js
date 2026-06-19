const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

exports.crear = async (req, res) => {
  try {
    const { nombres, apellidos, email, password, rol } = req.body;
    if (!nombres || !apellidos || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Campos obligatorios: nombres, apellidos, email, password' });
    }

    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from('usuarios')
      .insert([{ nombres, apellidos, email, password: hash, rol: rol || 'VENDEDOR' }])
      .select('id, nombres, apellidos, email, rol, estado, created_at');

    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.status(201).json({ ok: true, mensaje: 'Usuario creado', data: data[0] });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const { data, error } = await supabase.from('usuarios')
      .select('id, nombres, apellidos, email, rol, estado, created_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, data, total: data.length });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('usuarios')
      .select('id, nombres, apellidos, email, rol, estado, created_at')
      .eq('id', id).single();

    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, email, password, rol, estado } = req.body;

    const campos = {};
    if (nombres) campos.nombres = nombres;
    if (apellidos) campos.apellidos = apellidos;
    if (email) campos.email = email;
    if (rol) campos.rol = rol;
    if (estado !== undefined) campos.estado = estado;
    if (password) campos.password = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from('usuarios').update(campos).eq('id', id)
      .select('id, nombres, apellidos, email, rol, estado, created_at');

    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, mensaje: 'Usuario actualizado', data: data[0] });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
