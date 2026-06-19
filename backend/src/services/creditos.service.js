const supabase = require('../config/supabase');

const creditosService = {

  async crear({ venta_id, total, numero_cuotas, fecha_inicio, usuario_id }) {
    const fechaBase = fecha_inicio ? new Date(fecha_inicio) : new Date();
    const montoCuota = Math.ceil((total / numero_cuotas) * 100) / 100;
    const ultimaCuota = total - (montoCuota * (numero_cuotas - 1));

    const { data: credito, error: errC } = await supabase
      .from('creditos')
      .insert([{
        venta_id,
        total,
        saldo_pendiente: total,
        numero_cuotas,
        fecha_inicio: fechaBase.toISOString().split('T')[0],
        estado: 'ACTIVO'
      }])
      .select()
      .single();

    if (errC) throw errC;

    const cuotas = [];
    for (let i = 1; i <= numero_cuotas; i++) {
      const vencimiento = new Date(fechaBase);
      vencimiento.setMonth(vencimiento.getMonth() + i);
      const monto = i === numero_cuotas ? ultimaCuota : montoCuota;

      cuotas.push({
        credito_id: credito.id,
        numero: i,
        fecha_vencimiento: vencimiento.toISOString().split('T')[0],
        monto,
        saldo_pendiente: monto,
        estado: 'PENDIENTE'
      });
    }

    const { error: errCu } = await supabase.from('cuotas').insert(cuotas);
    if (errCu) throw errCu;

    return credito;
  },

  async listar({ estado, venta_id, desde, hasta, page, limit } = {}) {
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('creditos')
      .select('*, ventas!inner(cliente_id, total, created_at, clientes(nombres, apellidos, cedula))', { count: 'exact' });

    if (estado) query = query.eq('estado', estado);
    if (venta_id) query = query.eq('venta_id', venta_id);
    if (desde) query = query.gte('created_at', desde);
    if (hasta) query = query.lte('created_at', hasta);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, total: count, page: parseInt(page) || 1, pageSize };
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('creditos')
      .select('*, ventas(*, clientes(*)), cuotas(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async obtenerPorVentaId(venta_id) {
    const { data, error } = await supabase
      .from('creditos')
      .select('*, cuotas(*)')
      .eq('venta_id', venta_id)
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id, campos) {
    const { data, error } = await supabase
      .from('creditos')
      .update(campos)
      .eq('id', id)
      .select('*, cuotas(*)');

    if (error) throw error;
    return data[0];
  },

  async listarCuotas(credito_id) {
    const { data, error } = await supabase
      .from('cuotas')
      .select('*')
      .eq('credito_id', credito_id)
      .order('numero', { ascending: true });

    if (error) throw error;
    return data;
  },

  async registrarAbono(credito_id, monto) {
    const { data: credito, error: errC } = await supabase
      .from('creditos')
      .select('id, venta_id, saldo_pendiente, estado')
      .eq('id', credito_id)
      .single();

    if (errC || !credito) throw new Error('Crédito no encontrado');
    if (credito.estado === 'PAGADO') throw new Error('El crédito ya está pagado');

    const nuevoSaldo = Math.max(0, credito.saldo_pendiente - monto);
    const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO' : 'ACTIVO';

    const { error: errUpd } = await supabase
      .from('creditos')
      .update({ saldo_pendiente: nuevoSaldo, estado: nuevoEstado })
      .eq('id', credito_id);

    if (errUpd) throw errUpd;

    if (nuevoSaldo <= 0) {
      await supabase.from('ventas').update({ estado: 'COMPLETADA' }).eq('id', credito.venta_id);
    }

    const { data: cuotasPendientes } = await supabase
      .from('cuotas')
      .select('id, monto, saldo_pendiente')
      .eq('credito_id', credito_id)
      .eq('estado', 'PENDIENTE')
      .order('numero', { ascending: true });

    let restante = monto;
    for (const cuota of cuotasPendientes) {
      if (restante <= 0) break;
      const pagoCuota = Math.min(restante, cuota.saldo_pendiente);
      const nuevoSaldoCuota = cuota.saldo_pendiente - pagoCuota;
      restante -= pagoCuota;

      await supabase
        .from('cuotas')
        .update({
          saldo_pendiente: Math.max(0, nuevoSaldoCuota),
          estado: nuevoSaldoCuota <= 0 ? 'PAGADA' : 'PENDIENTE'
        })
        .eq('id', cuota.id);
    }

    return { saldo_pendiente: nuevoSaldo, estado: nuevoEstado };
  }

};

module.exports = creditosService;
