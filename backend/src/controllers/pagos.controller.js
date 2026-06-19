const supabase = require('../config/supabase');

exports.listar = async (req, res) => {
  try {
    const { tipo_pago, cliente_id, desde, hasta, page, limit } = req.query;
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('pagos')
      .select('*, clientes(nombres, apellidos, cedula)', { count: 'exact' });

    if (tipo_pago) query = query.eq('tipo_pago', tipo_pago);
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

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('pagos')
      .select('*, clientes(*)').eq('id', id).single();

    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'Pago no encontrado' });

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { cliente_id, tipo_pago, referencia_id, valor, observaciones } = req.body;
    if (!cliente_id || !tipo_pago || !valor) {
      return res.status(400).json({ ok: false, mensaje: 'cliente_id, tipo_pago y valor son obligatorios' });
    }

    const { data, error } = await supabase.from('pagos')
      .insert([{ cliente_id, tipo_pago, referencia_id, valor, observaciones, usuario_id: req.user.id }])
      .select().single();

    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.status(201).json({ ok: true, mensaje: 'Pago registrado', data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listarPendientes = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('pagos')
      .select('*, ventas(cliente_id, clientes(nombres, apellidos, cedula))', { count: 'exact' })
      .eq('estado', 'PENDIENTE')
      .order('fecha', { ascending: false })
      .range(from, to);

    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    const creditosIds = data.filter(p => p.tipo_pago === 'CREDITO' && p.referencia_id)
      .map(p => p.referencia_id);

    let creditosMap = {};
    if (creditosIds.length > 0) {
      const { data: creditos } = await supabase
        .from('creditos')
        .select('id, saldo, estado')
        .in('id', creditosIds);

      creditosMap = Object.fromEntries((creditos || []).map(c => [c.id, c]));
    }

    const enriched = data.map(p => ({
      ...p,
      credito_info: p.tipo_pago === 'CREDITO' ? (creditosMap[p.referencia_id] || null) : null
    }));

    res.json({ ok: true, data: enriched, total: count, page: parseInt(page) || 1, pageSize });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.aprobarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;

    const { data: pago, error: errP } = await supabase
      .from('pagos')
      .select('*')
      .eq('id', id)
      .single();

    if (errP || !pago) return res.status(404).json({ ok: false, mensaje: 'Pago no encontrado' });
    if (pago.estado !== 'PENDIENTE') return res.status(400).json({ ok: false, mensaje: 'El pago ya fue procesado' });

    await supabase.from('pagos').update({
      estado: 'APROBADO',
      observacion: observacion || 'Pago aprobado',
      usuario_id: req.user.id
    }).eq('id', id);

    if (pago.tipo_pago === 'CREDITO' && pago.referencia_id) {
      const { data: credito } = await supabase
        .from('creditos')
        .select('id, saldo, estado')
        .eq('id', pago.referencia_id)
        .single();

      if (credito && credito.estado !== 'PAGADO') {
        const nuevoSaldo = Math.max(0, credito.saldo - Number(pago.valor));
        const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO' : 'ACTIVO';

        await supabase.from('creditos').update({
          saldo: nuevoSaldo,
          estado: nuevoEstado
        }).eq('id', credito.id);

        if (nuevoSaldo <= 0) {
          await supabase.from('ventas').update({ estado: 'COMPLETADA' }).eq('id', pago.venta_id);
        }
      }
    }

    res.json({ ok: true, mensaje: 'Pago aprobado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.rechazarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;

    if (!observacion) {
      return res.status(400).json({ ok: false, mensaje: 'Debe proporcionar una observación del rechazo' });
    }

    const { data: pago, error: errP } = await supabase
      .from('pagos')
      .select('id, estado')
      .eq('id', id)
      .single();

    if (errP || !pago) return res.status(404).json({ ok: false, mensaje: 'Pago no encontrado' });
    if (pago.estado !== 'PENDIENTE') return res.status(400).json({ ok: false, mensaje: 'El pago ya fue procesado' });

    await supabase.from('pagos').update({
      estado: 'RECHAZADO',
      observacion,
      usuario_id: req.user.id
    }).eq('id', id);

    res.json({ ok: true, mensaje: 'Pago rechazado' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.registrarEfectivo = async (req, res) => {
  try {
    const { credito_id, monto, cliente_id, observacion } = req.body;

    if (!credito_id || !monto || !cliente_id) {
      return res.status(400).json({ ok: false, mensaje: 'credito_id, monto y cliente_id son obligatorios' });
    }

    const montoNum = parseFloat(monto);
    if (montoNum <= 0) {
      return res.status(400).json({ ok: false, mensaje: 'El monto debe ser mayor a 0' });
    }

    const { data: credito, error: errCred } = await supabase
      .from('creditos')
      .select('id, venta_id, saldo, estado')
      .eq('id', credito_id)
      .single();

    if (errCred || !credito) {
      return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });
    }

    if (credito.estado === 'PAGADO') {
      return res.status(400).json({ ok: false, mensaje: 'El crédito ya está pagado' });
    }

    const { data: pago, error: errPago } = await supabase
      .from('pagos')
      .insert([{
        cliente_id,
        venta_id: credito.venta_id,
        tipo_pago: 'CREDITO',
        referencia_id: credito_id,
        valor: Math.min(montoNum, credito.saldo),
        metodo_pago: 'EFECTIVO',
        comprobante: null,
        estado: 'APROBADO',
        observacion: observacion || 'Pago en efectivo registrado por el negocio',
        usuario_id: req.user.id
      }])
      .select()
      .single();

    if (errPago) return res.status(400).json({ ok: false, mensaje: errPago.message });

    const nuevoSaldo = Math.max(0, credito.saldo - Number(pago.valor));
    const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO' : 'ACTIVO';

    await supabase.from('creditos').update({
      saldo: nuevoSaldo,
      estado: nuevoEstado
    }).eq('id', credito.id);

    if (nuevoSaldo <= 0) {
      await supabase.from('ventas').update({ estado: 'COMPLETADA' }).eq('id', credito.venta_id);
    }

    res.status(201).json({
      ok: true,
      mensaje: 'Pago en efectivo registrado y aplicado correctamente',
      data: pago
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
