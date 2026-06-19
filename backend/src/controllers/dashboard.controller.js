const supabase = require('../config/supabase');

exports.resumen = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [
      { data: ventasHoy }, { data: ventasMes }, { data: totalVentas },
      { count: clientesActivos }, { data: productos },
      { data: creditos }, { data: planesSepare }
    ] = await Promise.all([
      supabase.from('ventas').select('total').gte('fecha', hoy).neq('estado', 'ANULADA'),
      supabase.from('ventas').select('total').gte('fecha', inicioMes).neq('estado', 'ANULADA'),
      supabase.from('ventas').select('id, total').neq('estado', 'ANULADA'),
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      supabase.from('productos').select('id, stock, stock_minimo').eq('estado', true),
      supabase.from('creditos').select('saldo').neq('estado', 'PAGADO'),
      supabase.from('planes_separe').select('saldo').neq('estado', 'COMPLETADO')
    ]);

    const ventasHoyTotal = (ventasHoy || []).reduce((s, v) => s + Number(v.total), 0);
    const ventasMesTotal = (ventasMes || []).reduce((s, v) => s + Number(v.total), 0);
    const ventasTotal = (totalVentas || []).reduce((s, v) => s + Number(v.total), 0);
    const bajoStock = (productos || []).filter((p) => p.stock <= p.stock_minimo).length;
    const creditosPend = (creditos || []).reduce((s, c) => s + Number(c.saldo), 0);
    const planPend = (planesSepare || []).reduce((s, p) => s + Number(p.saldo), 0);

    res.json({
      ok: true,
      data: {
        ventas: { hoy: ventasHoyTotal, mes: ventasMesTotal, total: ventasTotal },
        clientes_activos: clientesActivos || 0,
        productos_activos: productos?.length || 0,
        productos_bajo_stock: bajoStock,
        creditos_pendientes: creditosPend,
        plan_separe_pendiente: planPend
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.evolucionMensual = async (req, res) => {
  try {
    const anio = new Date().getFullYear();
    const { data, error } = await supabase
      .from('ventas')
      .select('total, fecha')
      .gte('fecha', `${anio}-01-01`)
      .lt('fecha', `${anio + 1}-01-01`)
      .neq('estado', 'ANULADA')
      .order('fecha');
 
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });
 
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1, label: new Date(anio, i).toLocaleString('es', { month: 'short' }), total: 0, cantidad: 0
    }));

    for (const v of data) {
      const m = new Date(v.fecha).getMonth();
      meses[m].total += Number(v.total);
      meses[m].cantidad++;
    }

    res.json({ ok: true, data: meses });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
