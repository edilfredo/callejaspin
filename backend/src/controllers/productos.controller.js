const supabase = require('../config/supabase');

exports.crear = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, categoria_id, marca, precio_compra, precio_venta, stock, stock_minimo, imagen, tipo_adicional, datos_adicionales } = req.body;
    if (!codigo || !nombre || !categoria_id || !precio_venta) {
      return res.status(400).json({ ok: false, mensaje: 'codigo, nombre, categoria_id y precio_venta son obligatorios' });
    }

    const { data: prod, error: errP } = await supabase.from('productos')
      .insert([{ codigo, nombre, descripcion, categoria_id, marca, precio_compra: precio_compra || 0, precio_venta, stock: stock || 0, stock_minimo: stock_minimo || 5, imagen }])
      .select().single();

    if (errP) {
      if (errP.code === '23505') return res.status(409).json({ ok: false, mensaje: 'El código ya existe' });
      return res.status(400).json({ ok: false, mensaje: errP.message });
    }

    if (tipo_adicional && datos_adicionales) {
      const tablaAdicional = { REPUESTOS: 'repuestos', ROPA: 'ropa', MISCELANEA: 'miscelanea', BELLEZA: 'belleza' }[tipo_adicional];
      if (tablaAdicional) {
        await supabase.from(tablaAdicional).insert([{ producto_id: prod.id, ...datos_adicionales }]);
      }
    }

    res.status(201).json({ ok: true, mensaje: 'Producto creado', data: prod });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const { categoria_id, estado } = req.query;

    let query = supabase.from('productos')
      .select('*, categorias(nombre), repuestos(*), ropa(*), miscelanea(*), belleza(*)')
      .order('nombre');

    if (categoria_id) query = query.eq('categoria_id', categoria_id);
    if (estado !== undefined) query = query.eq('estado', estado === 'true');

    const { data, error } = await query;
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, data, total: data.length });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('productos')
      .select('*, categorias(*), repuestos(*), ropa(*), miscelanea(*), belleza(*)')
      .eq('id', id).single();

    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, categoria_id, marca, precio_compra, precio_venta, stock, stock_minimo, imagen, estado } = req.body;

    const campos = {};
    if (codigo) campos.codigo = codigo;
    if (nombre) campos.nombre = nombre;
    if (descripcion !== undefined) campos.descripcion = descripcion;
    if (categoria_id) campos.categoria_id = categoria_id;
    if (marca !== undefined) campos.marca = marca;
    if (precio_compra !== undefined) campos.precio_compra = precio_compra;
    if (precio_venta !== undefined) campos.precio_venta = precio_venta;
    if (stock !== undefined) campos.stock = stock;
    if (stock_minimo !== undefined) campos.stock_minimo = stock_minimo;
    if (imagen !== undefined) campos.imagen = imagen;
    if (estado !== undefined) campos.estado = estado;

    const { data, error } = await supabase.from('productos').update(campos).eq('id', id).select().single();
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, mensaje: 'Producto actualizado', data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    for (const tbl of ['repuestos', 'ropa', 'miscelanea', 'belleza']) {
      await supabase.from(tbl).delete().eq('producto_id', id);
    }

    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, mensaje: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
