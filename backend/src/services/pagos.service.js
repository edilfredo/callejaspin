const supabase = require('../config/supabase');

const pagosService = {

  async listar({ tipo_pago, venta_id, metodo_pago, estado, desde, hasta, page, limit } = {}) {
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('pagos')
      .select('*, ventas!inner(cliente_id, tipo_venta, total, clientes(nombres, apellidos, cedula))', { count: 'exact' });

    if (tipo_pago) query = query.eq('tipo_pago', tipo_pago);
    if (venta_id) query = query.eq('venta_id', venta_id);
    if (metodo_pago) query = query.eq('metodo_pago', metodo_pago);
    if (estado) query = query.eq('estado', estado);
    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);

    const { data, error, count } = await query
      .order('fecha', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, total: count, page: parseInt(page) || 1, pageSize };
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('pagos')
      .select('*, ventas(*, clientes(*))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async obtenerPorVentaId(venta_id) {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('venta_id', venta_id)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data;
  },

  async actualizarEstado(id, estado, observacion) {
    const campos = { estado };
    if (observacion) campos.observacion = observacion;

    const { data, error } = await supabase
      .from('pagos')
      .update(campos)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async resumen({ desde, hasta } = {}) {
    let query = supabase
      .from('pagos')
      .select('tipo_pago, metodo_pago, estado, valor, fecha')
      .eq('estado', 'APROBADO');

    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);

    const { data, error } = await query;
    if (error) throw error;

    const total = data.reduce((s, p) => s + Number(p.valor), 0);

    const porMetodo = {};
    const porTipo = {};
    for (const p of data) {
      porMetodo[p.metodo_pago] = (porMetodo[p.metodo_pago] || 0) + Number(p.valor);
      porTipo[p.tipo_pago] = (porTipo[p.tipo_pago] || 0) + Number(p.valor);
    }

    return {
      total,
      cantidad: data.length,
      por_metodo: porMetodo,
      por_tipo: porTipo
    };
  }

};

module.exports = pagosService;
