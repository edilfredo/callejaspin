const supabase = require('../config/supabase');

exports.crearVenta = async (req, res) => {
  try {
    const { cliente_id, tipo_venta, detalles } = req.body;

    if (!tipo_venta || !detalles || !detalles.length) {
      return res.status(400).json({ ok: false, mensaje: 'tipo_venta y detalles son obligatorios' });
    }

    if (!['CONTADO', 'CREDITO', 'SEPARE'].includes(tipo_venta)) {
      return res.status(400).json({ ok: false, mensaje: 'tipo_venta inválido' });
    }

    let total = 0;
    const detallesData = [];

    for (const item of detalles) {
      const { data: prod } = await supabase.from('productos')
        .select('id, nombre, precio_venta, stock').eq('id', item.producto_id).single();

      if (!prod) return res.status(404).json({ ok: false, mensaje: `Producto ${item.producto_id} no encontrado` });

      const precio = item.precio || prod.precio_venta;
      const subtotal = precio * item.cantidad;
      total += subtotal;
      detallesData.push({ producto_id: prod.id, cantidad: item.cantidad, precio, subtotal });
    }

    const { data: venta, error: errV } = await supabase.from('ventas')
      .insert([{ cliente_id: cliente_id || null, usuario_id: req.user.id, tipo_venta, total }])
      .select().single();

    if (errV) return res.status(500).json({ ok: false, mensaje: 'Error al crear venta', error: errV.message });

    for (const d of detallesData) d.venta_id = venta.id;

    const { error: errD } = await supabase.from('detalle_ventas').insert(detallesData);
    if (errD) return res.status(500).json({ ok: false, mensaje: 'Error al registrar detalles', error: errD.message });

    if (tipo_venta === 'CONTADO') {
      for (const d of detallesData) {
        const { data: prod } = await supabase.from('productos').select('stock').eq('id', d.producto_id).single();
        await supabase.from('productos').update({ stock: prod.stock - d.cantidad }).eq('id', d.producto_id);
        await supabase.from('movimientos_inventario').insert([{
          producto_id: d.producto_id, tipo_movimiento: 'SALIDA', cantidad: d.cantidad,
          observacion: `Venta contado #${venta.id}`, usuario_id: req.user.id
        }]);
      }

      await supabase.from('pagos').insert([{
        cliente_id, tipo_pago: 'CONTADO', valor: total, usuario_id: req.user.id
      }]);
    }

    if (tipo_venta === 'CREDITO') {
      const hoy = new Date();
      const fechaFin = new Date(hoy); fechaFin.setMonth(fechaFin.getMonth() + 3);

      await supabase.from('creditos').insert([{
        cliente_id, venta_id: venta.id, monto_total: total,
        saldo: total, fecha_inicio: hoy.toISOString().split('T')[0],
        fecha_fin: fechaFin.toISOString().split('T')[0]
      }]).select().single();
    }

    if (tipo_venta === 'SEPARE') {
      const hoy = new Date();
      const fechaLimite = new Date(); fechaLimite.setDate(fechaLimite.getDate() + 30);

      const { data: plan, error: errPlan } = await supabase.from('planes_separe').insert([{
        cliente_id, monto_total: total, saldo: total,
        fecha_inicio: hoy.toISOString().split('T')[0],
        fecha_limite: fechaLimite.toISOString().split('T')[0],
        estado: 'ACTIVO'
      }]).select().single();

      if (errPlan) return res.status(500).json({ ok: false, mensaje: 'Error al crear plan separe', error: errPlan.message });

      if (plan) {
        const detSepare = detallesData.map(d => ({
          plan_id: plan.id, producto_id: d.producto_id,
          cantidad: d.cantidad, valor: d.subtotal
        }));
        const { error: errDet } = await supabase.from('detalle_separe').insert(detSepare);
        if (errDet) return res.status(500).json({ ok: false, mensaje: 'Error al registrar detalles separe', error: errDet.message });
      }
    }

    const { data: ventaCompleta } = await supabase.from('ventas')
      .select('*, detalle_ventas(*, productos(codigo, nombre)), clientes(nombres, apellidos)')
      .eq('id', venta.id).single();

    res.status(201).json({ ok: true, mensaje: 'Venta creada', data: ventaCompleta });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listarVentas = async (req, res) => {
  try {
    const { tipo_venta, estado, cliente_id, desde, hasta, page, limit } = req.query;
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('ventas')
      .select('*, clientes(nombres, apellidos, cedula)', { count: 'exact' });

    if (tipo_venta) query = query.eq('tipo_venta', tipo_venta);
    if (estado) query = query.eq('estado', estado);
    if (cliente_id) query = query.eq('cliente_id', cliente_id);
    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);

    const { data, error, count } = await query.order('fecha', { ascending: false }).range(from, to);
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, data, total: count, page: parseInt(page) || 1, pageSize });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.obtenerVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('ventas')
      .select('*, clientes(*), detalle_ventas(*, productos(*, categorias(nombre)))')
      .eq('id', id).single();

    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' });

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.anularVenta = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: venta } = await supabase.from('ventas').select('id, estado').eq('id', id).single();
    if (!venta) return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' });
    if (venta.estado === 'ANULADA') return res.status(400).json({ ok: false, mensaje: 'Ya está anulada' });

    const { data: detalles } = await supabase.from('detalle_ventas')
      .select('producto_id, cantidad').eq('venta_id', id);

    for (const d of detalles) {
      const { data: prod } = await supabase.from('productos').select('stock').eq('id', d.producto_id).single();
      await supabase.from('productos').update({ stock: prod.stock + d.cantidad }).eq('id', d.producto_id);
      await supabase.from('movimientos_inventario').insert([{
        producto_id: d.producto_id, tipo_movimiento: 'ENTRADA', cantidad: d.cantidad,
        observacion: `Anulación venta #${id}`, usuario_id: req.user.id
      }]);
    }

    await supabase.from('ventas').update({ estado: 'ANULADA' }).eq('id', id);

    res.json({ ok: true, mensaje: 'Venta anulada y stock restaurado' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
