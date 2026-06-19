const supabase = require('../config/supabase');

const reportesService = {

  async ventasPorPeriodo({ desde, hasta } = {}) {
    let query = supabase
      .from('ventas')
      .select('id, tipo, total, created_at')
      .neq('estado', 'ANULADA');

    if (desde) query = query.gte('created_at', desde);
    if (hasta) query = query.lte('created_at', hasta);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    const totalVentas = data.reduce((s, v) => s + Number(v.total), 0);
    const porTipo = {};
    for (const v of data) {
      porTipo[v.tipo] = (porTipo[v.tipo] || 0) + Number(v.total);
    }

    return { total: totalVentas, cantidad: data.length, por_tipo: porTipo, datos: data };
  },

  async productosMasVendidos({ desde, hasta, limit: take = 10 } = {}) {
    let query = supabase
      .from('venta_detalle')
      .select('producto_id, cantidad, subtotal, ventas!inner(created_at, estado)')
      .neq('ventas.estado', 'ANULADA');

    if (desde) query = query.gte('ventas.created_at', desde);
    if (hasta) query = query.lte('ventas.created_at', hasta);

    const { data, error } = await query;
    if (error) throw error;

    const agrupado = {};
    for (const d of data) {
      if (!agrupado[d.producto_id]) agrupado[d.producto_id] = { producto_id: d.producto_id, cantidad: 0, total: 0 };
      agrupado[d.producto_id].cantidad += d.cantidad;
      agrupado[d.producto_id].total += Number(d.subtotal);
    }

    const ordenado = Object.values(agrupado)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, take);

    const ids = ordenado.map((p) => p.producto_id);
    const { data: productos } = await supabase
      .from('productos')
      .select('id, codigo, nombre, marca')
      .in('id', ids);

    const prodMap = Object.fromEntries((productos || []).map((p) => [p.id, p]));

    return ordenado.map((item) => ({
      ...item,
      producto: prodMap[item.producto_id] || null
    }));
  },

  async clientesFrecuentes({ desde, hasta, limit: take = 10 } = {}) {
    let query = supabase
      .from('ventas')
      .select('cliente_id, total, created_at')
      .not('cliente_id', 'is', null)
      .neq('estado', 'ANULADA');

    if (desde) query = query.gte('created_at', desde);
    if (hasta) query = query.lte('created_at', hasta);

    const { data, error } = await query;
    if (error) throw error;

    const agrupado = {};
    for (const v of data) {
      if (!agrupado[v.cliente_id]) agrupado[v.cliente_id] = { cliente_id: v.cliente_id, compras: 0, total: 0 };
      agrupado[v.cliente_id].compras++;
      agrupado[v.cliente_id].total += Number(v.total);
    }

    const ordenado = Object.values(agrupado)
      .sort((a, b) => b.compras - a.compras)
      .slice(0, take);

    const ids = ordenado.map((c) => c.cliente_id);
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, cedula, nombres, apellidos')
      .in('id', ids);

    const cliMap = Object.fromEntries((clientes || []).map((c) => [c.id, c]));

    return ordenado.map((item) => ({
      ...item,
      cliente: cliMap[item.cliente_id] || null
    }));
  },

  async inventarioValorizado() {
    const { data, error } = await supabase
      .from('productos')
      .select('id, codigo, nombre, stock, precio_compra, precio_venta, stock_minimo')
      .eq('estado', 'ACTIVO');

    if (error) throw error;

    const totalCosto = data.reduce((s, p) => s + (Number(p.precio_compra) || 0) * p.stock, 0);
    const totalVenta = data.reduce((s, p) => s + Number(p.precio_venta) * p.stock, 0);
    const bajoStock = data.filter((p) => p.stock <= p.stock_minimo);

    return {
      total_productos: data.length,
      total_costo: totalCosto,
      total_venta: totalVenta,
      ganancia_potencial: totalVenta - totalCosto,
      bajo_stock: bajoStock.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        stock: p.stock,
        stock_minimo: p.stock_minimo
      }))
    };
  }

};

module.exports = reportesService;
