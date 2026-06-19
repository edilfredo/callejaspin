-- ============================================================
-- Migración: Agregar columnas faltantes a tabla pagos
-- para el flujo de aprobación de pagos (cliente → staff)
-- ============================================================
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor)

-- Ya existen en pagos: id, cliente_id, valor, tipo_pago, fecha, comprobante, usuario_id, referencia_id

-- Agregar columna para vincular con la venta original
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE;

-- Agregar columna para el método de pago (NEQUI, BANCOLOMBIA, EFECTIVO, etc.)
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(30);

-- Agregar columna para estado del flujo de aprobación
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'PENDIENTE';
