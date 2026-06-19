const supabase = require('../config/supabase');

exports.solicitarPago = async (req, res) => {
  try {
    const { credito_id, monto, metodo_pago, observacion } = req.body;
    const clienteId = req.cliente.id;

    if (!credito_id || !monto || !metodo_pago) {
      return res.status(400).json({ ok: false, mensaje: 'credito_id, monto y metodo_pago son obligatorios' });
    }

    if (metodo_pago === 'EFECTIVO') {
      return res.status(400).json({ ok: false, mensaje: 'El pago en efectivo debe ser registrado directamente en el negocio' });
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

    const { data: venta, error: errVenta } = await supabase
      .from('ventas')
      .select('id, cliente_id')
      .eq('id', credito.venta_id)
      .single();

    if (errVenta || !venta) {
      return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' });
    }

    if (venta.cliente_id !== clienteId) {
      return res.status(403).json({ ok: false, mensaje: 'Este crédito no te pertenece' });
    }

    let comprobanteUrl = null;
    if (req.file) {
      comprobanteUrl = `/uploads/${req.file.filename}`;
    }

    const { data: pago, error: errPago } = await supabase
      .from('pagos')
      .insert([{
        cliente_id: clienteId,
        venta_id: credito.venta_id,
        tipo_pago: 'CREDITO',
        metodo_pago,
        referencia_id: credito_id,
        valor: Math.min(montoNum, credito.saldo),
        comprobante: comprobanteUrl,
        estado: 'PENDIENTE',
        observacion: observacion || 'Pago solicitado por cliente',
        usuario_id: null,
        fecha: new Date().toISOString()
      }])
      .select()
      .single();

    if (errPago) return res.status(400).json({ ok: false, mensaje: errPago.message });

    res.status(201).json({
      ok: true,
      mensaje: 'Solicitud de pago enviada. Pendiente de aprobación.',
      data: pago
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.misPagos = async (req, res) => {
  try {
    const clienteId = req.cliente.id;

    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false });

    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};