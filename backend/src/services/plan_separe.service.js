const supabase = require('../config/supabase');

const planSepareService = {

  async listar({ estado, venta_id, desde, hasta, page, limit } = {}) {
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('plan_separe')
      .select('*, ventas!inner(cliente_id, total, fecha, clientes(nombres, apellidos, cedula))', { count: 'exact' });

    if (estado) query = query.eq('estado', estado);
    if (venta_id) query = query.eq('venta_id', venta_id);
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
      .from('plan_separe')
      .select('*, ventas(*, clientes(*)), pagos(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async obtenerPorVentaId(venta_id) {
    const { data, error } = await supabase
      .from('plan_separe')
      .select('*, pagos(*)')
      .eq('venta_id', venta_id)
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id, campos) {
    const { data, error } = await supabase
      .from('plan_separe')
      .update(campos)
      .eq('id', id)
      .select('*, pagos(*)');

    if (error) throw error;
    return data[0];
  },

  async listarPagos(plan_separe_id) {
    const { data: ps } = await supabase
      .from('plan_separe')
      .select('venta_id')
      .eq('id', plan_separe_id)
      .single();

    if (!ps) throw new Error('Plan Separe no encontrado');

    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('venta_id', ps.venta_id)
      .eq('tipo_pago', 'PLAN_SEPARE')
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data;
  },

  async registrarAbono(plan_separe_id, { monto, metodo_pago, comprobante, observacion, usuario_id }) {
    const { data: ps, error: errPS } = await supabase
      .from('plan_separe')
      .select('id, venta_id, abono_inicial, saldo_pendiente, estado')
      .eq('id', plan_separe_id)
      .single();

    if (errPS || !ps) throw new Error('Plan Separe no encontrado');
    if (ps.estado === 'COMPLETADO') throw new Error('El Plan Separe ya está completado');
    if (ps.estado === 'VENCIDO') throw new Error('El Plan Separe está vencido');
    if (monto <= 0) throw new Error('El monto debe ser mayor a 0');

    const nuevoSaldo = Math.max(0, ps.saldo_pendiente - monto);
    const nuevoEstado = nuevoSaldo <= 0 ? 'COMPLETADO' : 'ACTIVO';

    const { error: errUpd } = await supabase
      .from('plan_separe')
      .update({ saldo_pendiente: nuevoSaldo, estado: nuevoEstado })
      .eq('id', plan_separe_id);

    if (errUpd) throw errUpd;

    if (nuevoSaldo <= 0) {
      await supabase.from('ventas').update({ estado: 'COMPLETADA' }).eq('id', ps.venta_id);

      const { data: detalles } = await supabase
        .from('detalle_ventas')
        .select('producto_id, cantidad')
        .eq('venta_id', ps.venta_id);

      for (const d of detalles) {
        const { data: prod } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', d.producto_id)
          .single();

        await supabase
          .from('productos')
          .update({ stock: prod.stock - d.cantidad })
          .eq('id', d.producto_id);

        await supabase.from('movimientos_inventario').insert([{
          producto_id: d.producto_id,
          tipo_movimiento: 'SALIDA',
          cantidad: d.cantidad,
          observacion: `Entrega plan separe #${ps.venta_id}`,
          usuario_id
        }]);
      }
    }

    const { data: pago, error: errPago } = await supabase
      .from('pagos')
      .insert([{
        venta_id: ps.venta_id,
        tipo_pago: 'PLAN_SEPARE',
        referencia_id: ps.id,
        valor: monto,
        metodo_pago: metodo_pago || 'EFECTIVO',
        comprobante,
        estado: 'APROBADO',
        observacion,
        usuario_id
      }])
      .select()
      .single();

    if (errPago) throw errPago;

    return { saldo_pendiente: nuevoSaldo, estado: nuevoEstado, pago };
  }

};

module.exports = planSepareService;
