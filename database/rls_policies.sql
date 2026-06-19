ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY categorias_all ON categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY usuarios_all ON usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY clientes_all ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY productos_all ON productos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE repuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY repuestos_all ON repuestos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE ropa ENABLE ROW LEVEL SECURITY;
CREATE POLICY ropa_all ON ropa FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE miscelanea ENABLE ROW LEVEL SECURITY;
CREATE POLICY miscelanea_all ON miscelanea FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE belleza ENABLE ROW LEVEL SECURITY;
CREATE POLICY belleza_all ON belleza FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY ventas_all ON ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY detalle_ventas_all ON detalle_ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE creditos ENABLE ROW LEVEL SECURITY;
CREATE POLICY creditos_all ON creditos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE cuotas_credito ENABLE ROW LEVEL SECURITY;
CREATE POLICY cuotas_credito_all ON cuotas_credito FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE planes_separe ENABLE ROW LEVEL SECURITY;
CREATE POLICY planes_separe_all ON planes_separe FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE detalle_separe ENABLE ROW LEVEL SECURITY;
CREATE POLICY detalle_separe_all ON detalle_separe FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE abonos ENABLE ROW LEVEL SECURITY;
CREATE POLICY abonos_all ON abonos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY pagos_all ON pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY movimientos_inventario_all ON movimientos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY auditoria_all ON auditoria FOR ALL TO authenticated USING (true) WITH CHECK (true);
