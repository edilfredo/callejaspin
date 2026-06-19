const supabase = require('../config/supabase');

exports.crearCredito = async (req, res) => {
  try {
    const { cliente_id, monto_total, fecha_inicio, fecha_fin, venta_id } = req.body;
    if (!cliente_id || !monto_total) {
      return res.status(400).json({ ok: false, mensaje: 'cliente_id y monto_total son obligatorios' });
    }

    const { data: credito, error: errC } = await supabase.from('creditos')
      .insert([{ cliente_id, venta_id, monto_total, saldo: monto_total, fecha_inicio, fecha_fin }])
      .select().single();

    if (errC) return res.status(400).json({ ok: false, mensaje: errC.message });

    res.status(201).json({ ok: true, mensaje: 'Crédito creado', data: credito });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listarCreditos = async (req, res) => {
  try {
    const { estado, cliente_id, page, limit } = req.query;
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('creditos')
      .select('*, clientes(nombres, apellidos, cedula)', { count: 'exact' });

    if (estado) query = query.eq('estado', estado);
    if (cliente_id) query = query.eq('cliente_id', cliente_id);

    const { data, error, count } = await query.order('fecha_inicio', { ascending: false }).range(from, to);
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    const ventaIds = [...new Set((data || []).map(c => c.venta_id).filter(Boolean))];
    let productosMap = {};
    if (ventaIds.length > 0) {
      const { data: detalles } = await supabase
        .from('detalle_ventas')
        .select('venta_id, cantidad, precio, subtotal, productos(codigo, nombre, precio_venta)')
        .in('venta_id', ventaIds);
      for (const d of (detalles || [])) {
        if (!productosMap[d.venta_id]) productosMap[d.venta_id] = [];
        productosMap[d.venta_id].push(d);
      }
    }

    const enriched = (data || []).map(c => ({
      ...c,
      productos: productosMap[c.venta_id] || []
    }));

    res.json({ ok: true, data: enriched, total: count, page: parseInt(page) || 1, pageSize });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.obtenerCredito = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('creditos')
      .select('*, clientes(*)').eq('id', id).single();

    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });

    const { data: detalles } = await supabase
      .from('detalle_ventas')
      .select('*, productos(codigo, nombre, precio_venta)')
      .eq('venta_id', data.venta_id);

    res.json({ ok: true, data: { ...data, productos: detalles || [] } });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.registrarAbono = async (req, res) => {
  try {
    const { id } = req.params;
    const { valor, observacion } = req.body;

    if (!valor || valor <= 0) return res.status(400).json({ ok: false, mensaje: 'valor debe ser mayor a 0' });

    const { data: credito } = await supabase.from('creditos').select('*').eq('id', id).single();
    if (!credito) return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });
    if (credito.estado === 'PAGADO') return res.status(400).json({ ok: false, mensaje: 'Ya está pagado' });

    const nuevoSaldo = Math.max(0, credito.saldo - valor);

    await supabase.from('abonos').insert([{
      cliente_id: credito.cliente_id, credito_id: id, valor, observacion
    }]);

    await supabase.from('creditos').update({
      saldo: nuevoSaldo, estado: nuevoSaldo <= 0 ? 'PAGADO' : 'ACTIVO'
    }).eq('id', id);

    res.json({ ok: true, mensaje: nuevoSaldo <= 0 ? 'Crédito pagado completamente' : 'Abono registrado', data: { saldo: nuevoSaldo } });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listarPagos = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: creditos } = await supabase.from('creditos')
      .select('cliente_id').eq('id', id).single();

    if (!creditos) return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });

    const { data: pagos, error: errP } = await supabase.from('pagos')
      .select('*')
      .eq('referencia_id', id)
      .eq('tipo_pago', 'CREDITO')
      .order('fecha', { ascending: false });

    const { data: abonos, error: errA } = await supabase.from('abonos')
      .select('*')
      .eq('credito_id', id)
      .order('fecha', { ascending: false });

    if (errP || errA) return res.status(400).json({ ok: false, mensaje: 'Error al cargar pagos' });

    const todos = [
      ...(pagos || []).map(p => ({
        ...p, tipo: 'pago',
        fecha: p.fecha || p.created_at,
        valor: p.valor
      })),
      ...(abonos || []).map(a => ({
        ...a, tipo: 'abono',
        fecha: a.fecha
      }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({ ok: true, data: todos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
