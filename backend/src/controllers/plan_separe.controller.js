const supabase = require('../config/supabase');

exports.crearPlan = async (req, res) => {
  try {
    const { cliente_id, monto_total, fecha_limite, abono_inicial, productos } = req.body;
    if (!cliente_id || !monto_total || !fecha_limite) {
      return res.status(400).json({ ok: false, mensaje: 'cliente_id, monto_total y fecha_limite son obligatorios' });
    }

    const saldoInicial = monto_total - (abono_inicial || 0);

    const hoy = new Date().toISOString().split('T')[0];
    const { data: plan, error: errP } = await supabase.from('planes_separe')
      .insert([{ cliente_id, monto_total, saldo: saldoInicial, fecha_inicio: hoy, fecha_limite, estado: 'ACTIVO' }])
      .select().single();

    if (errP) return res.status(400).json({ ok: false, mensaje: errP.message });

    if (productos && productos.length) {
      const detalles = productos.map((p) => ({
        plan_id: plan.id, producto_id: p.producto_id, cantidad: p.cantidad, valor: p.valor
      }));
      const { error: errD } = await supabase.from('detalle_separe').insert(detalles);
      if (errD) return res.status(500).json({ ok: false, mensaje: 'Error al registrar detalles', error: errD.message });
    }

    if (abono_inicial > 0) {
      await supabase.from('abonos').insert([{
        cliente_id, plan_id: plan.id, valor: abono_inicial, observacion: 'Abono inicial plan separe'
      }]);
    }

    res.status(201).json({ ok: true, mensaje: 'Plan Separe creado', data: plan });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.listarPlanes = async (req, res) => {
  try {
    const { estado, cliente_id, page, limit } = req.query;
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const from = ((parseInt(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('planes_separe')
      .select('*, clientes(nombres, apellidos, cedula)', { count: 'exact' });

    if (estado) query = query.eq('estado', estado);
    if (cliente_id) query = query.eq('cliente_id', cliente_id);

    const { data, error, count } = await query.order('fecha_limite', { ascending: false }).range(from, to);
    if (error) return res.status(400).json({ ok: false, mensaje: error.message });

    res.json({ ok: true, data, total: count, page: parseInt(page) || 1, pageSize });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.obtenerPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('planes_separe')
      .select('*, clientes(*), detalle_separe(*, productos(codigo, nombre)), abonos(*)')
      .eq('id', id).single();

    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'Plan no encontrado' });

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};

exports.registrarAbono = async (req, res) => {
  try {
    const { id } = req.params;
    const { valor, observacion } = req.body;

    if (!valor || valor <= 0) return res.status(400).json({ ok: false, mensaje: 'valor debe ser mayor a 0' });

    const { data: plan } = await supabase.from('planes_separe').select('*').eq('id', id).single();
    if (!plan) return res.status(404).json({ ok: false, mensaje: 'Plan no encontrado' });
    if (plan.estado === 'COMPLETADO') return res.status(400).json({ ok: false, mensaje: 'Ya está completado' });

    const nuevoSaldo = Math.max(0, plan.saldo - valor);

    await supabase.from('abonos').insert([{
      cliente_id: plan.cliente_id, plan_id: id, valor, observacion
    }]);

    await supabase.from('planes_separe').update({
      saldo: nuevoSaldo, estado: nuevoSaldo <= 0 ? 'COMPLETADO' : 'ACTIVO'
    }).eq('id', id);

    if (nuevoSaldo <= 0) {
      const { data: detalles } = await supabase.from('detalle_separe')
        .select('producto_id, cantidad').eq('plan_id', id);

      for (const d of detalles) {
        const { data: prod } = await supabase.from('productos').select('stock').eq('id', d.producto_id).single();
        await supabase.from('productos').update({ stock: prod.stock - d.cantidad }).eq('id', d.producto_id);
        await supabase.from('movimientos_inventario').insert([{
          producto_id: d.producto_id, tipo_movimiento: 'SALIDA', cantidad: d.cantidad,
          observacion: `Entrega plan separe #${id}`, usuario_id: req.user.id
        }]);
      }
    }

    res.json({
      ok: true,
      mensaje: nuevoSaldo <= 0 ? 'Plan completado, productos entregados' : 'Abono registrado',
      data: { saldo: nuevoSaldo }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
  }
};
