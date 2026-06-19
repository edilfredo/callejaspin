const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

exports.crear = async (req, res) => {
  try {
    const { cedula, nombres, apellidos, telefono, direccion, email, password } = req.body;
    if (!cedula || !nombres || !apellidos) {
      return res.status(400).json({ ok: false, mensaje: 'cedula, nombres y apellidos son obligatorios' });
    }

    const payload = { cedula, nombres, apellidos, telefono, direccion, email };
    if (password) payload.password = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from('clientes').insert([payload]).select().single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ ok: false, mensaje: 'La cédula o email ya existe' });
      return res.status(400).json({ ok: false, mensaje: error.message });
    }

    res.status(201).json({ ok: true, mensaje: 'Cliente creado', data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const { search, estado } = req.query;
    let query = supabase.from('clientes').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`cedula.ilike.%${search}%,nombres.ilike.%${search}%,apellidos.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error, count } = await query.order('fecha_registro', { ascending: false });
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, data, total: count ?? data.length });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado' });

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula, nombres, apellidos, telefono, direccion, email, password } = req.body;

    const campos = {};
    if (cedula) campos.cedula = cedula;
    if (nombres) campos.nombres = nombres;
    if (apellidos) campos.apellidos = apellidos;
    if (telefono !== undefined) campos.telefono = telefono;
    if (direccion !== undefined) campos.direccion = direccion;
    if (email) campos.email = email;
    if (password) campos.password = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from('clientes').update(campos).eq('id', id).select().single();
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, mensaje: 'Cliente actualizado', data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, mensaje: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.obtenerCreditosCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: ventas } = await supabase
      .from('ventas')
      .select('id')
      .eq('cliente_id', id);

    const ventaIds = (ventas || []).map(v => v.id);

    let creditos = [];

    if (ventaIds.length > 0) {
      const { data: creditosRaw } = await supabase
        .from('creditos')
        .select('*')
        .in('venta_id', ventaIds)
        .order('fecha_inicio', { ascending: false });

      creditos = creditosRaw || [];
    }

    res.json({ ok: true, data: creditos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.misDatos = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.cliente.id) !== String(id)) {
      return res.status(403).json({ ok: false, mensaje: 'No puedes ver los datos de otro cliente' });
    }

    const { data: ventas } = await supabase
      .from('ventas')
      .select('id, total, estado, fecha')
      .eq('cliente_id', id)
      .order('fecha', { ascending: false });

    const ventaIds = (ventas || []).map(v => v.id);

    let creditos = [];
    let planesSepare = [];

    if (ventaIds.length > 0) {
      creditos = (await supabase
        .from('creditos')
        .select('*')
        .in('venta_id', ventaIds)
        .order('fecha_inicio', { ascending: false })).data || [];

      const creditoVentaIds = [...new Set((creditos || []).map(c => c.venta_id).filter(Boolean))];
      let productosMap = {};
      if (creditoVentaIds.length > 0) {
        const { data: detalles } = await supabase
          .from('detalle_ventas')
          .select('venta_id, cantidad, precio, subtotal, productos(codigo, nombre)')
          .in('venta_id', creditoVentaIds);
        for (const d of (detalles || [])) {
          if (!productosMap[d.venta_id]) productosMap[d.venta_id] = [];
          productosMap[d.venta_id].push(d);
        }
      }
      creditos = (creditos || []).map(c => ({
        ...c,
        productos: productosMap[c.venta_id] || []
      }));
    }

    const { data: planRaw } = await supabase
      .from('planes_separe')
      .select('*')
      .eq('cliente_id', id)
      .order('fecha_limite', { ascending: false });

    const planIds = (planRaw || []).map(p => p.id);

    if (planIds.length > 0) {
      const { data: detallesRaw } = await supabase
        .from('detalle_separe')
        .select('*, productos(codigo, nombre)')
        .in('plan_id', planIds);

      const { data: abonosRaw } = await supabase
        .from('abonos')
        .select('*')
        .in('plan_id', planIds)
        .order('fecha', { ascending: false });

      const { data: pagosPlan } = await supabase
        .from('pagos')
        .select('*')
        .in('referencia_id', planIds)
        .eq('estado', 'APROBADO')
        .order('fecha', { ascending: false });

      const detallesMap = {};
      for (const d of (detallesRaw || [])) {
        if (!detallesMap[d.plan_id]) detallesMap[d.plan_id] = [];
        detallesMap[d.plan_id].push(d);
      }

      const abonosMap = {};
      for (const a of (abonosRaw || [])) {
        if (!abonosMap[a.plan_id]) abonosMap[a.plan_id] = [];
        abonosMap[a.plan_id].push(a);
      }

      for (const p of (pagosPlan || [])) {
        if (!abonosMap[p.referencia_id]) abonosMap[p.referencia_id] = [];
        abonosMap[p.referencia_id].push({
          id: p.id, valor: p.valor, metodo_pago: p.metodo_pago,
          observacion: p.observacion, fecha: p.fecha
        });
      }

      planesSepare = (planRaw || []).map(p => ({
        ...p,
        detalle_separe: detallesMap[p.id] || [],
        abonos: abonosMap[p.id] || []
      }));
    }

    const { data: pagosCliente } = await supabase
      .from('pagos')
      .select('*')
      .eq('cliente_id', id)
      .eq('estado', 'APROBADO')
      .order('fecha', { ascending: false });

    res.json({
      ok: true,
      data: {
        creditos,
        planes_separe: planesSepare,
        abonos: (pagosCliente || []).map(p => ({
          id: p.id,
          valor: p.valor,
          metodo_pago: p.metodo_pago,
          observacion: p.observacion,
          fecha: p.fecha
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
