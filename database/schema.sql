-- ============================================================
-- SISTEMA COMERCIAL WEB — CallejasPin
-- Esquema de base de datos
-- ============================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombres    VARCHAR(100) NOT NULL,
  apellidos  VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  rol        VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'VENDEDOR', 'CAJERO', 'BODEGA')),
  estado     VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION trigger_updated_at();

-- RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "usuarios_select_admin" ON usuarios
  FOR SELECT TO authenticated
  USING (
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "usuarios_insert_admin" ON usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "usuarios_update_admin" ON usuarios
  FOR UPDATE TO authenticated
  USING (
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "usuarios_delete_admin" ON usuarios
  FOR DELETE TO authenticated
  USING (
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'ADMIN'
  );

-- ============================================================
-- 2. TABLA: categorias
-- ============================================================
CREATE TABLE categorias (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo     VARCHAR(50) UNIQUE NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  descripcion TEXT,
  estado     VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER categorias_updated_at
  BEFORE UPDATE ON categorias
  FOR EACH ROW
  EXECUTE FUNCTION trigger_updated_at();

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_all" ON categorias
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. TABLA: productos
-- ============================================================
CREATE TABLE productos (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo       VARCHAR(50) UNIQUE NOT NULL,
  nombre       VARCHAR(150) NOT NULL,
  descripcion  TEXT,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  marca        VARCHAR(100),
  precio_compra DECIMAL(12,2) CHECK (precio_compra >= 0),
  precio_venta DECIMAL(12,2) NOT NULL CHECK (precio_venta >= 0),
  stock        INT DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INT DEFAULT 0 CHECK (stock_minimo >= 0),
  imagen       TEXT,
  estado       VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos_all" ON productos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. TABLA: clientes
-- ============================================================
CREATE TABLE clientes (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cedula        VARCHAR(20) UNIQUE NOT NULL,
  nombres       VARCHAR(100) NOT NULL,
  apellidos     VARCHAR(100),
  telefono      VARCHAR(20),
  direccion     TEXT,
  email         VARCHAR(150),
  estado        VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_updated_at();

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_all" ON clientes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 5. TABLA: movimientos_inventario
-- ============================================================
CREATE TABLE movimientos_inventario (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo_movimiento VARCHAR(30) NOT NULL,
  cantidad        INT NOT NULL CHECK (cantidad > 0),
  costo           DECIMAL(12,2) DEFAULT 0,
  observacion     TEXT,
  usuario_id      UUID REFERENCES usuarios(id),
  fecha           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimientos_inventario_all" ON movimientos_inventario
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 6. TABLA: ventas
-- ============================================================
CREATE TABLE ventas (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  tipo       VARCHAR(20) NOT NULL CHECK (tipo IN ('CONTADO', 'CREDITO', 'PLAN_SEPARE')),
  subtotal   DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento  DECIMAL(12,2) DEFAULT 0,
  total      DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado     VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('COMPLETADA', 'PENDIENTE', 'ANULADA')),
  usuario_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_all" ON ventas
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 7. TABLA: venta_detalle
-- ============================================================
CREATE TABLE venta_detalle (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venta_id     UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id  UUID NOT NULL REFERENCES productos(id),
  cantidad     INT NOT NULL CHECK (cantidad > 0),
  precio_venta DECIMAL(12,2) NOT NULL,
  subtotal     DECIMAL(12,2) NOT NULL
);

ALTER TABLE venta_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venta_detalle_all" ON venta_detalle
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 8. TABLA: creditos
-- ============================================================
CREATE TABLE creditos (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venta_id        UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  total           DECIMAL(12,2) NOT NULL,
  saldo_pendiente DECIMAL(12,2) NOT NULL,
  numero_cuotas   INT NOT NULL,
  fecha_inicio    DATE DEFAULT CURRENT_DATE,
  estado          VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'PAGADO', 'VENCIDO')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creditos_all" ON creditos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 9. TABLA: cuotas
-- ============================================================
CREATE TABLE cuotas (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  credito_id      UUID NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
  numero          INT NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  monto           DECIMAL(12,2) NOT NULL,
  saldo_pendiente DECIMAL(12,2) NOT NULL,
  estado          VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PAGADA', 'VENCIDA')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuotas_all" ON cuotas
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 10. TABLA: plan_separe
-- ============================================================
CREATE TABLE plan_separe (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venta_id        UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  abono_inicial   DECIMAL(12,2) NOT NULL,
  saldo_pendiente DECIMAL(12,2) NOT NULL,
  fecha_limite    DATE,
  estado          VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'COMPLETADO', 'VENCIDO')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plan_separe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_separe_all" ON plan_separe
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 11. TABLA: pagos
-- ============================================================
CREATE TABLE pagos (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venta_id        UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  tipo_referencia VARCHAR(20) CHECK (tipo_referencia IN ('CREDITO', 'PLAN_SEPARE', 'CONTADO')),
  referencia_id   UUID,
  monto           DECIMAL(12,2) NOT NULL,
  metodo_pago     VARCHAR(30) DEFAULT 'EFECTIVO',
  comprobante     TEXT,
  estado          VARCHAR(20) DEFAULT 'APROBADO' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  observacion     TEXT,
  usuario_id      UUID REFERENCES usuarios(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_all" ON pagos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
