const supabase = require('../config/supabase');

const dashboardService = {

  async obtenerResumen() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();

    const [
      { data: ventasHoy },
      { data: ventasMes },
      { data: totalVentas },
      { data: pagosHoy },
      { data: clientes },
      { data: productos },
      { data: creditos },
      { data: planesSepare }
    ] = await Promise.all([
      supabase.from('ventas').select('total').gte('created_at', hoy.toISOString().split('T')[0]).neq('estado', 'ANULADA'),
      supabase.from('ventas').select('total').gte('created_at', inicioMes).neq('estado', 'ANULADA'),
      supabase.from('ventas').select('id, total').neq('estado', 'ANULADA'),
      supabase.from('pagos').select('monto').eq('estado', 'APROBADO').gte('created_at', hoy.toISOString().split('T')[0]),
      supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estado', 'ACTIVO'),
      supabase.from('productos').select('id, stock, stock_minimo', { count: 'exact', head: false }).eq('estado', 'ACTIVO'),
      supabase.from('creditos').select('id, saldo_pendiente', { count: 'exact', head: false }).neq('estado', 'PAGADO'),
      supabase.from('plan_separe').select('id, saldo_pendiente', { count: 'exact', head: false }).neq('estado', 'COMPLETADO')
    ]);

    const ventasHoyTotal = (ventasHoy || []).reduce((s, v) => s + Number(v.total), 0);
    const ventasMesTotal = (ventasMes || []).reduce((s, v) => s + Number(v.total), 0);
    const ventasTotalGeneral = (totalVentas || []).reduce((s, v) => s + Number(v.total), 0);
    const pagosHoyTotal = (pagosHoy || []).reduce((s, p) => s + Number(p.valor), 0);
    const productosBajoStock = (productos || []).filter((p) => p.stock <= p.stock_minimo).length;
    const creditosPendientes = (creditos || []).reduce((s, c) => s + Number(c.saldo_pendiente), 0);
    const planSeparePendiente = (planesSepare || []).reduce((s, p) => s + Number(p.saldo_pendiente), 0);

    return {
      ventas: {
        hoy: ventasHoyTotal,
        mes: ventasMesTotal,
        total: ventasTotalGeneral
      },
      pagos: {
        hoy: pagosHoyTotal
      },
      clientes_activos: clientes?.length || 0,
      productos_activos: productos?.length || 0,
      productos_bajo_stock: productosBajoStock,
      creditos_pendientes: creditosPendientes,
      plan_separe_pendiente: planSeparePendiente
    };
  },

  async obtenerEvolucionMensual() {
    const anio = new Date().getFullYear();

    const { data, error } = await supabase
      .from('ventas')
      .select('total, created_at')
      .gte('created_at', `${anio}-01-01`)
      .lt('created_at', `${anio + 1}-01-01`)
      .neq('estado', 'ANULADA')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      label: new Date(anio, i).toLocaleString('es', { month: 'short' }),
      total: 0,
      cantidad: 0
    }));

    for (const v of data) {
      const mes = new Date(v.created_at).getMonth();
      meses[mes].total += Number(v.total);
      meses[mes].cantidad++;
    }

    return meses;
  }

};

module.exports = dashboardService;
