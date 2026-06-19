ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ventas_all ON ventas;
CREATE POLICY ventas_all ON ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS detalle_ventas_all ON detalle_ventas;
CREATE POLICY detalle_ventas_all ON detalle_ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS productos_all ON productos;
CREATE POLICY productos_all ON productos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS movimientos_inventario_all ON movimientos_inventario;
CREATE POLICY movimientos_inventario_all ON movimientos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pagos_all ON pagos;
CREATE POLICY pagos_all ON pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);
