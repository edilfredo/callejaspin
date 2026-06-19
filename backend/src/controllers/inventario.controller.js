const supabase = require('../config/supabase');

exports.listarMovimientos = async (req, res) => {
  try {
    const { producto_id, tipo_movimiento, desde, hasta, page, limit } = req.query;
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('movimientos_inventario')
      .select('*, productos(codigo, nombre)', { count: 'exact' });

    if (producto_id) query = query.eq('producto_id', producto_id);
    if (tipo_movimiento) query = query.eq('tipo_movimiento', tipo_movimiento);
    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);

    const { data, error, count } = await query.order('fecha', { ascending: false }).range(from, to);
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, data, total: count, page: parseInt(page) || 1, pageSize });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.crearMovimiento = async (req, res) => {
  try {
    const { producto_id, tipo_movimiento, cantidad, costo, observacion } = req.body;
    if (!producto_id || !tipo_movimiento || !cantidad) {
      return res.status(400).json({ ok: false, mensaje: 'producto_id, tipo_movimiento y cantidad son obligatorios' });
    }

    if (!['ENTRADA', 'SALIDA', 'AJUSTE'].includes(tipo_movimiento)) {
      return res.status(400).json({ ok: false, mensaje: 'tipo_movimiento inválido' });
    }

    const { data: prod } = await supabase.from('productos').select('stock').eq('id', producto_id).single();
    if (!prod) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });

    let stockNuevo = prod.stock;
    if (tipo_movimiento === 'ENTRADA') stockNuevo += cantidad;
    else if (tipo_movimiento === 'SALIDA') stockNuevo -= cantidad;
    else if (tipo_movimiento === 'AJUSTE') stockNuevo = cantidad;

    if (stockNuevo < 0) return res.status(400).json({ ok: false, mensaje: 'Stock insuficiente' });

    const { data: mov, error: errM } = await supabase.from('movimientos_inventario')
      .insert([{ producto_id, tipo_movimiento, cantidad, costo, observacion, usuario_id: req.user.id }])
      .select().single();

    if (errM) return res.status(400).json({ ok: false, mensaje: errM.message });

    await supabase.from('productos').update({ stock: stockNuevo }).eq('id', producto_id);

    res.status(201).json({ ok: true, mensaje: 'Movimiento registrado', data: mov });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
