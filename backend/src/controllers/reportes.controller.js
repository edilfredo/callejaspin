const supabase = require('../config/supabase');

exports.ventasPorPeriodo = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let query = supabase.from('ventas')
      .select('id, tipo_venta, total, fecha')
      .neq('estado', 'ANULADA');

    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);

    const { data, error } = await query.order('fecha');
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    const total = data.reduce((s, v) => s + Number(v.total), 0);
    const porTipo = {};
    for (const v of data) porTipo[v.tipo_venta] = (porTipo[v.tipo_venta] || 0) + Number(v.total);

    res.json({ ok: true, data: { total, cantidad: data.length, por_tipo: porTipo, datos: data } });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.productosMasVendidos = async (req, res) => {
  try {
    const { desde, hasta, limit: take = 10 } = req.query;
    let query = supabase.from('detalle_ventas')
      .select('producto_id, cantidad, subtotal, ventas!inner(fecha, estado)')
      .neq('ventas.estado', 'ANULADA');

    if (desde) query = query.gte('ventas.fecha', desde);
    if (hasta) query = query.lte('ventas.fecha', hasta);

    const { data, error } = await query;
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    const agrupado = {};
    for (const d of data) {
      if (!agrupado[d.producto_id]) agrupado[d.producto_id] = { producto_id: d.producto_id, cantidad: 0, total: 0 };
      agrupado[d.producto_id].cantidad += d.cantidad;
      agrupado[d.producto_id].total += Number(d.subtotal);
    }

    const ordenado = Object.values(agrupado).sort((a, b) => b.cantidad - a.cantidad).slice(0, take);
    const ids = ordenado.map((p) => p.producto_id);
    const { data: productos } = await supabase.from('productos').select('id, codigo, nombre, marca').in('id', ids);
    const prodMap = Object.fromEntries((productos || []).map((p) => [p.id, p]));

    res.json({ ok: true, data: ordenado.map((item) => ({ ...item, producto: prodMap[item.producto_id] || null })) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.clientesFrecuentes = async (req, res) => {
  try {
    const { desde, hasta, limit: take = 10 } = req.query;
    let query = supabase.from('ventas')
      .select('cliente_id, total, fecha')
      .not('cliente_id', 'is', null)
      .neq('estado', 'ANULADA');

    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);

    const { data, error } = await query;
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    const agrupado = {};
    for (const v of data) {
      if (!agrupado[v.cliente_id]) agrupado[v.cliente_id] = { cliente_id: v.cliente_id, compras: 0, total: 0 };
      agrupado[v.cliente_id].compras++;
      agrupado[v.cliente_id].total += Number(v.total);
    }

    const ordenado = Object.values(agrupado).sort((a, b) => b.compras - a.compras).slice(0, take);
    const ids = ordenado.map((c) => c.cliente_id);
    const { data: clientes } = await supabase.from('clientes').select('id, cedula, nombres, apellidos').in('id', ids);
    const cliMap = Object.fromEntries((clientes || []).map((c) => [c.id, c]));

    res.json({ ok: true, data: ordenado.map((item) => ({ ...item, cliente: cliMap[item.cliente_id] || null })) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.inventarioValorizado = async (req, res) => {
  try {
    const { data, error } = await supabase.from('productos')
      .select('id, codigo, nombre, stock, precio_compra, precio_venta, stock_minimo, estado')
      .eq('estado', true);

    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    const totalCosto = data.reduce((s, p) => s + (Number(p.precio_compra) || 0) * p.stock, 0);
    const totalVenta = data.reduce((s, p) => s + Number(p.precio_venta) * p.stock, 0);
    const bajoStock = data.filter((p) => p.stock <= p.stock_minimo);

    res.json({
      ok: true,
      data: {
        total_productos: data.length, total_costo: totalCosto, total_venta: totalVenta,
        ganancia_potencial: totalVenta - totalCosto,
        bajo_stock: bajoStock.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, stock: p.stock, stock_minimo: p.stock_minimo }))
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
