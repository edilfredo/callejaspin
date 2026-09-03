const supabase = require('../config/supabase');

exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, mensaje: 'nombre es obligatorio' });

    const { data, error } = await supabase.from('categorias').insert([{ nombre, descripcion }]).select().single();
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.status(201).json({ ok: true, mensaje: 'Categoría creada', data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const { data, error } = await supabase.from('categorias').select('*').order('nombre');
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, data, total: data.length });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('categorias').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;

    const campos = {};
    if (nombre) campos.nombre = nombre;
    if (descripcion !== undefined) campos.descripcion = descripcion;
    if (estado !== undefined) campos.estado = estado;

    const { data, error } = await supabase.from('categorias').update(campos).eq('id', id).select().single();
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, mensaje: 'Categoría actualizada', data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, mensaje: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
