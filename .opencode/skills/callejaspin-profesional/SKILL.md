---
name: callejaspin-profesional
description: Sistema Comercial CallejasPin — Node.js + Express + Supabase + React + Vite. Todos los módulos construidos: auth, usuarios, clientes, categorías, productos, inventario, ventas, créditos, plan separe, pagos, reportes, dashboard.
---

# CallejasPin Profesional — Estado Actual del Proyecto

Basado en **SKILL PROFESIONAL BASE.docx**. Sistema completamente construido con 12 módulos backend + frontend React.

## Arquitectura General

```
Frontend (React + Vite) — localhost:5173
    |  proxy /api → localhost:3000
    |  REST API
Backend (Node.js + Express) — localhost:3000
    |  Supabase SDK
Supabase (PostgreSQL)
```

## Tecnologías Implementadas

| Capa       | Tecnologías |
|------------|-------------|
| Backend    | Node.js, Express 5, @supabase/supabase-js 2, jsonwebtoken, bcrypt 6, dotenv, cors, ws, nodemon |
| Frontend   | React 18, Vite 5, React Router 6, Axios, Tailwind CSS 3, Zustand, lucide-react, react-hot-toast |
| Base datos | PostgreSQL vía Supabase con UUID, RLS Policies, Triggers, funciones |

## Estructura Backend Real

```
backend/src/
├── config/
│   └── supabase.js                    # Cliente Supabase con WebSocket
├── controllers/
│   ├── auth.controller.js             # register, login, loginCliente
│   ├── usuarios.controller.js         # CRUD usuarios
│   ├── clientes.controller.js         # CRUD + misDatos + obtenerCreditosCliente
│   ├── categoria.controller.js        # CRUD categorías
│   ├── productos.controller.js        # CRUD + tipos adicionales (repuestos, ropa, etc.)
│   ├── inventario.controller.js       # listarMovimientos, crearMovimiento
│   ├── ventas.controller.js           # crearVenta, listarVentas, obtenerVenta, anularVenta
│   ├── creditos.controller.js         # CRUD + registrarAbono + listarCuotas
│   ├── plan_separe.controller.js      # CRUD + registrarAbono
│   ├── pagos.controller.js            # CRUD + listarPendientes + aprobarPago + rechazarPago + registrarEfectivo
│   ├── pagosCliente.controller.js     # solicitarPago (cliente) + misPagos (historial)
│   ├── reportes.controller.js         # ventasPorPeriodo, productosMasVendidos, clientesFrecuentes, inventarioValorizado
│   └── dashboard.controller.js        # resumen, evolucionMensual
├── routes/
│   ├── auth.routes.js                 # POST /register, /login, /cliente-login
│   ├── usuarios.routes.js             # CRUD protegido [ADMIN]
│   ├── clientes.routes.js             # CRUD protegido + /:id/mis-datos + /:id/creditos
│   ├── categoria.routes.js            # CRUD protegido
│   ├── productos.routes.js            # CRUD protegido
│   ├── inventario.routes.js           # GET /, POST /movimientos
│   ├── ventas.routes.js               # POST /, GET /, GET /:id, PUT /:id/anular
│   ├── creditos.routes.js             # POST /, GET /, GET /:id, GET /:id/cuotas, POST /:id/abonos
│   ├── plan_separe.routes.js          # POST /, GET /, GET /:id, POST /:id/abonos
│   ├── pagos.routes.js                # GET /, GET /:id, POST /
│   ├── reportes.routes.js             # GET /ventas, /productos-mas-vendidos, /clientes-frecuentes, /inventario-valorizado
│   ├── dashboard.routes.js            # GET /, /evolucion-mensual
│   └── test.routes.js                 # GET /db (prueba conexión)
├── services/
│   ├── usuarios.service.js            # Servicio con bcrypt (patrón service)
│   ├── creditos.service.js
│   ├── pagos.service.js
│   ├── plan_separe.service.js
│   ├── reportes.service.js
│   └── dashboard.service.js
├── middlewares/
│   ├── auth.middleware.js             # Verifica JWT, decodifica en req.user
│   ├── roles.middleware.js            # Verifica rol(es) permitido(s)
│   ├── clienteAuth                   # Middleware cliente (sin .js)
│   └── aAuth                         # Middleware alternativo (sin .js)
├── utils/
│   └── upload.js                     # Multer: subida de comprobantes a uploads/
├── uploads/                          # Comprobantes de pago subidos por clientes
├── app.js                            # Monta todas las rutas, sirve /uploads como estático
├── server.js                         # Express listen con dotenv
└── seed.js                           # Script de seed (no encontrado en backend/src/)
```

## Estructura Frontend Real

```
frontend/
├── index.html
├── vite.config.js                     # Proxy /api → localhost:3000
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx                        # Router con 13 rutas
│   ├── index.css
│   ├── layouts/
│   │   └── MainLayout.jsx             # Sidebar + Outlet + Toaster, protege rutas
│   ├── components/
│   │   ├── Sidebar.jsx                # Menú con filtro por rol del usuario
│   │   ├── DataTable.jsx              # Tabla genérica con loading, edit, delete
│   │   └── Modal.jsx                  # Modal genérico con overlay
│   ├── pages/
│   │   ├── Login.jsx                  # Login usuarios internos
│   │   ├── ClienteLogin.jsx           # Login clientes
│   │   ├── ClienteDashboard.jsx       # Dashboard del cliente + pagar cuotas + subir comprobante
│   │   ├── Dashboard.jsx              # Dashboard admin con cards (ventas, clientes, etc.)
│   │   ├── Usuarios.jsx               # CRUD usuarios con modal
│   │   ├── Clientes.jsx               # CRUD clientes con modal
│   │   ├── Categorias.jsx             # CRUD categorías con modal
│   │   ├── Productos.jsx              # CRUD productos con selector de categoría
│   │   ├── Inventario.jsx             # Lista productos + movimientos + nuevo movimiento
│   │   ├── Ventas.jsx                 # Crear venta con detalle dinámico (contado/crédito/separe)
│   │   ├── Creditos.jsx               # Lista créditos (solo lectura)
│   │   ├── PlanSepare.jsx             # Lista + registrar abonos
│   │   ├── Pagos.jsx                  # Lista pagos + pendientes + aprobar/rechazar
│   │   └── Reportes.jsx               # 4 reportes con respuesta JSON en crudo
│   ├── store/
│   │   ├── authStore.js               # Zustand: login, logout, persistencia localStorage
│   │   └── clienteStore.js            # Zustand cliente
│   └── services/
│       ├── api.js                     # Axios con interceptors JWT + redirect 401
│       └── apiCliente.js              # Axios para cliente
```

## Esquema de Base de Datos

### schema.sql (REFERENCIA — puede estar desactualizado)

| Tabla | Columnas clave |
|-------|----------------|
| `usuarios` | id (UUID), nombres, apellidos, email (UNIQUE), password, rol (ADMIN/VENDEDOR/CAJERO/BODEGA), estado (ACTIVO/INACTIVO), created_at, updated_at |
| `categorias` | id (UUID), codigo (UNIQUE), nombre, descripcion, estado, created_at, updated_at |
| `productos` | id (UUID), codigo (UNIQUE), nombre, descripcion, categoria_id (FK), marca, precio_compra, precio_venta, stock, stock_minimo, imagen, estado |
| `clientes` | id (UUID), cedula (UNIQUE), nombres, apellidos, telefono, direccion, email, estado, fecha_registro, created_at, updated_at |
| `movimientos_inventario` | id (UUID), producto_id (FK), tipo_movimiento, cantidad, costo, observacion, usuario_id (FK), fecha |
| `ventas` | id (UUID), cliente_id (FK), tipo (CONTADO/CREDITO/PLAN_SEPARE), subtotal, descuento, total, estado (COMPLETADA/PENDIENTE/ANULADA), usuario_id (FK), created_at |
| `venta_detalle` | id (UUID), venta_id (FK), producto_id (FK), cantidad, precio_venta, subtotal |
| `creditos` | id (UUID), venta_id (FK), total, saldo_pendiente, numero_cuotas, fecha_inicio, estado (ACTIVO/PAGADO/VENCIDO) |
| `cuotas` | id (UUID), credito_id (FK), numero, fecha_vencimiento, monto, saldo_pendiente, estado (PENDIENTE/PAGADA/VENCIDA) |
| `plan_separe` | id (UUID), venta_id (FK), abono_inicial, saldo_pendiente, fecha_limite, estado (ACTIVO/COMPLETADO/VENCIDO) |
| `pagos` | id (UUID), venta_id (FK), tipo_referencia (CREDITO/PLAN_SEPARE/CONTADO), referencia_id (UUID), monto, metodo_pago, comprobante, estado (PENDIENTE/APROBADO/RECHAZADO), observacion, usuario_id (FK) |

### BD REAL (descubierta por consultas directas — ES LA QUE IMPORTA)

| Tabla | Columnas clave | Diferencias con schema.sql |
|-------|---------------|---------------------------|
| `ventas` | id (UUID), cliente_id (FK), **tipo_venta** (CONTADO/CREDITO/SEPARE), subtotal, descuento, total, estado, usuario_id (FK), **fecha** | `tipo_venta` en vez de `tipo`; `fecha` en vez de `created_at`; `SEPARE` en vez de `PLAN_SEPARE` |
| `detalle_ventas` | id (UUID), venta_id (FK), producto_id (FK), cantidad, precio_venta, subtotal | `detalle_ventas` en vez de `venta_detalle` |
| `creditos` | id (UUID), venta_id (FK), **cliente_id** (FK), **monto_total**, **cuota_mensual**, **saldo**, fecha_inicio, fecha_fin, estado (ACTIVO/PAGADO/VENCIDO) | `cliente_id`, `monto_total`, `cuota_mensual`, `saldo` en vez de `total`, `saldo_pendiente`, `numero_cuotas`; adicional `fecha_fin` |
| `cuotas_credito` | id (UUID), credito_id (FK), **numero_cuota**, fecha_vencimiento, **valor**, estado (PENDIENTE/PAGADA/VENCIDA) | `cuotas_credito` en vez de `cuotas`; `numero_cuota`, `valor` en vez de `numero`, `monto` |
| `planes_separe` | id (UUID), venta_id (FK), abono_inicial, saldo_pendiente, fecha_limite, estado (ACTIVO/COMPLETADO/VENCIDO) | `planes_separe` en vez de `plan_separe` |
| `detalle_separe` | id (UUID), plan_id (FK), producto_id (FK), cantidad, precio_unitario | Solo existe en BD real |
| `pagos` | id (UUID), **cliente_id** (FK), **tipo_pago** (CREDITO/PLAN_SEPARE/CONTADO), referencia_id (UUID), **valor**, metodo_pago, comprobante, usuario_id (FK), **venta_id** (añadido migración), **estado** (añadido migración), **observacion** (añadido migración), **fecha** | `cliente_id`, `tipo_pago`, `valor` en vez de `venta_id`, `tipo_referencia`, `monto`; columnas `venta_id`, `metodo_pago`, `estado`, `observacion` fueron añadidas por migración |
| `abonos` | id (UUID), plan_id (FK), monto, metodo_pago, fecha, usuario_id (FK) | Solo existe en BD real |

> ⚠️ **ADVERTENCIA**: `database/schema.sql` NO refleja la estructura real de Supabase. Siempre verificar columnas reales con `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '...'` antes de escribir código nuevo. El código debe adaptarse a la BD real, no al schema.sql.

## Rutas API Completas

### Auth (públicas)
| Método | Ruta | Controlador |
|--------|------|-------------|
| POST | `/api/auth/register` | auth.register |
| POST | `/api/auth/login` | auth.login |
| POST | `/api/auth/cliente-login` | auth.loginCliente |

### Usuarios [ADMIN]
| Método | Ruta | Controlador |
|--------|------|-------------|
| POST | `/api/usuarios` | crear |
| GET | `/api/usuarios` | listar |
| GET | `/api/usuarios/:id` | obtener |
| PUT | `/api/usuarios/:id` | actualizar |
| DELETE | `/api/usuarios/:id` | eliminar |

### Clientes [auth]
| Método | Ruta | Middleware | Controlador |
|--------|------|------------|-------------|
| POST | `/api/clientes` | auth | crear |
| GET | `/api/clientes` | auth | listar |
| GET | `/api/clientes/:id` | auth | obtener |
| GET | `/api/clientes/:id/mis-datos` | clienteAuth | misDatos (solo cliente autenticado) |
| GET | `/api/clientes/:id/creditos` | auth | obtenerCreditosCliente (admin/staff) |
| PUT | `/api/clientes/:id` | auth | actualizar |
| DELETE | `/api/clientes/:id` | auth | eliminar |
| POST | `/api/clientes/pagos` | clienteAuth + upload | solicitarPago (multipart: cuota_id, credito_id, monto, metodo_pago, comprobante) |
| GET | `/api/clientes/pagos` | clienteAuth | misPagos (historial de solicitudes del cliente) |

### Categorías [auth]
| Método | Ruta | Controlador |
|--------|------|-------------|
| POST | `/api/categorias` | crear |
| GET | `/api/categorias` | listar |
| GET | `/api/categorias/:id` | obtener |
| PUT | `/api/categorias/:id` | actualizar |
| DELETE | `/api/categorias/:id` | eliminar |

### Productos [auth]
| Método | Ruta | Controlador |
|--------|------|-------------|
| POST | `/api/productos` | crear |
| GET | `/api/productos` | listar (filtros: categoria_id, estado) |
| GET | `/api/productos/:id` | obtener |
| PUT | `/api/productos/:id` | actualizar |
| DELETE | `/api/productos/:id` | eliminar |

### Inventario
| Método | Ruta | Acceso | Controlador |
|--------|------|--------|-------------|
| GET | `/api/inventario` | auth | listarMovimientos (filtros: producto_id, tipo_movimiento, desde, hasta, page, limit) |
| POST | `/api/inventario/movimientos` | [ADMIN, BODEGA] | crearMovimiento |

### Ventas [auth]
| Método | Ruta | Controlador |
|--------|------|-------------|
| POST | `/api/ventas` | crearVenta (CONTADO/CREDITO/SEPARE con lógica completa) |
| GET | `/api/ventas` | listarVentas (filtros: tipo_venta, estado, cliente_id, desde, hasta, page, limit) |
| GET | `/api/ventas/:id` | obtenerVenta |
| PUT | `/api/ventas/:id/anular` | anularVenta (restaura stock) |

### Créditos
| Método | Ruta | Acceso | Controlador |
|--------|------|--------|-------------|
| POST | `/api/creditos` | [ADMIN, VENDEDOR] | crearCredito |
| GET | `/api/creditos` | [ADMIN, VENDEDOR, CAJERO] | listarCreditos |
| GET | `/api/creditos/:id` | auth | obtenerCredito |
| GET | `/api/creditos/:id/cuotas` | auth | listarCuotas (deprecado — devuelve vacío) |
| GET | `/api/creditos/:id/pagos` | auth | listarPagos (pagos+abonos del crédito) |
| POST | `/api/creditos/:id/abonos` | [ADMIN, CAJERO] | registrarAbono |

### Plan Separe
| Método | Ruta | Acceso | Controlador |
|--------|------|--------|-------------|
| POST | `/api/plan-separe` | [ADMIN, VENDEDOR] | crearPlan |
| GET | `/api/plan-separe` | [ADMIN, VENDEDOR, CAJERO] | listarPlanes |
| GET | `/api/plan-separe/:id` | auth | obtenerPlan |
| POST | `/api/plan-separe/:id/abonos` | [ADMIN, CAJERO] | registrarAbono |

### Pagos
| Método | Ruta | Acceso | Controlador |
|--------|------|--------|-------------|
| GET | `/api/pagos` | [ADMIN, CAJERO, VENDEDOR] | listar |
| GET | `/api/pagos/pendientes` | [ADMIN, CAJERO, VENDEDOR] | listarPendientes (con datos del cliente + cuotas) |
| GET | `/api/pagos/:id` | auth | obtener |
| POST | `/api/pagos` | [ADMIN, CAJERO] | crear |
| POST | `/api/pagos/efectivo` | [ADMIN, CAJERO] | registrarEfectivo (pago directo admin a crédito) |
| PUT | `/api/pagos/:id/aprobar` | [ADMIN, CAJERO] | aprobarPago (actualiza crédito y cuotas) |
| PUT | `/api/pagos/:id/rechazar` | [ADMIN, CAJERO] | rechazarPago (con observación) |

### Reportes
| Método | Ruta | Acceso | Controlador |
|--------|------|--------|-------------|
| GET | `/api/reportes/ventas` | [ADMIN, VENDEDOR] | ventasPorPeriodo |
| GET | `/api/reportes/productos-mas-vendidos` | [ADMIN, VENDEDOR] | productosMasVendidos |
| GET | `/api/reportes/clientes-frecuentes` | [ADMIN, VENDEDOR] | clientesFrecuentes |
| GET | `/api/reportes/inventario-valorizado` | [ADMIN, BODEGA] | inventarioValorizado |

### Dashboard
| Método | Ruta | Acceso | Controlador |
|--------|------|--------|-------------|
| GET | `/api/dashboard` | [ADMIN, VENDEDOR] | resumen |
| GET | `/api/dashboard/evolucion-mensual` | [ADMIN, VENDEDOR] | evolucionMensual |

## Seguridad — JWT

Login → Genera token con `{ id, email, rol, tipo }` + expiresIn 8h → Bearer en `Authorization` → `auth.middleware.js` verifica y decodifica en `req.user` → `roles.middleware.js` filtra por rol.

## Roles del Sistema y Acceso por Página

| Rol | Sidebar visible |
|-----|-----------------|
| ADMIN | Todo (Dashboard, Usuarios, Clientes, Categorías, Productos, Inventario, Ventas, Créditos, Plan Separe, Pagos, Reportes) |
| VENDEDOR | Dashboard, Clientes, Productos, Ventas, Créditos, Plan Separe, Pagos, Reportes |
| CAJERO | Dashboard, Clientes, Ventas, Créditos, Plan Separe, Pagos |
| BODEGA | Dashboard, Categorías, Productos, Inventario |

## Supabase RLS (database/rls_policies.sql)

Todas las tablas tienen `ENABLE ROW LEVEL SECURITY` con política `FOR ALL TO authenticated USING (true) WITH CHECK (true)`:
categorias, usuarios, clientes, productos, repuestos, ropa, miscelanea, belleza, ventas, detalle_ventas, creditos, cuotas_credito, planes_separe, detalle_separe, abonos, pagos, movimientos_inventario, auditoria

## Validaciones Backend

Los controllers validan campos obligatorios, existencia de registros, códigos duplicados (23505), stock negativo. No se valida formato email en backend.

## Manejo de Errores

```js
try { ... } catch (error) {
  res.status(500).json({ ok: false, mensaje: 'Error interno', error: error.message });
}
```

## Reglas de Negocio Implementadas

### Inventario
- `crearMovimiento` actualiza stock del producto directamente + registra en `movimientos_inventario`
- Soporta: ENTRADA (suma stock), SALIDA (resta), AJUSTE (setea cantidad exacta)

### Ventas
- `crearVenta` maneja los 3 tipos:
  - **CONTADO**: descuenta stock, crea movimiento SALIDA, registra pago
  - **CREDITO**: crea crédito con `monto_total` y `saldo` (sin cuotas fijas)
  - **SEPARE**: crea plan separe + detalle_separe (NO descuenta stock hasta completar)
- `anularVenta`: restaura stock + registra movimiento ENTRADA

### Créditos (sin cuotas fijas)
- Al crearse solo registra `monto_total` y `saldo` (NO genera `cuotas_credito`)
- El cliente puede pagar montos variables en cualquier momento
- `registrarAbono`: descuenta saldo, si saldo ≤ 0 marca PAGADO
- Los pagos se registran en `pagos` (electrónicos con aprobación) o `abonos` (manuales)
- `GET /creditos/:id/pagos`: lista todos los pagos (pagos + abonos) de un crédito
- **Productos visibles**: Cada crédito incluye los productos de la venta asociada (`detalle_ventas` con join a `productos`). Se muestran expandiendo la fila en la tabla (admin) o dentro de la tarjeta (cliente).

### Plan Separe
- `registrarAbono`: descuenta saldo, si saldo ≤ 0 descuenta stock de productos y entrega inventario
- Los productos apartados NO descuentan stock hasta que se complete el plan

### Pagos — Flujo Completo

#### Pagos Electrónicos (Cliente → Admin)
- **Cliente** → `POST /api/clientes/pagos` (multipart/form-data): envía `credito_id`, `monto`, `metodo_pago`, `comprobante` (jpg/png/pdf), `observacion`
- Se crea un `pago` con `estado='PENDIENTE'`, `tipo_pago='CREDITO'`, `referencia_id=credito_id`, `valor=monto` (columna BD real: `valor`, NO `monto`)
- **Staff** → `GET /api/pagos/pendientes`: lista pagos pendientes con datos del cliente + cuotas del crédito
- **Staff** → `PUT /api/pagos/:id/aprobar`: cambia estado a APROBADO, descuenta saldo del crédito, marca cuotas como PAGADAS, si saldo ≤ 0 completa la venta
- **Staff** → `PUT /api/pagos/:id/rechazar`: cambia estado a RECHAZADO con observación obligatoria
- **Cliente** → `GET /api/clientes/pagos`: ve el historial de sus solicitudes con estado y comprobante
- Los comprobantes se suben a `backend/uploads/` y se sirven estáticamente en `/uploads/`

#### Pago en Efectivo (Admin directo)
- **Staff** → `POST /api/pagos/efectivo`: admin/cajero registra pago manual de un crédito
  - Body: `{ credito_id, monto, cliente_id, observacion? }`
  - Crea `pago` con `estado='APROBADO'`, `tipo_pago='CREDITO'`, `metodo_pago='EFECTIVO'`
  - Aplica descuento a saldo del crédito y cuotas automáticamente
  - Si saldo ≤ 0, marca venta como COMPLETADA

## Convenciones de Nombres

```
*.controller.js
*.routes.js
*.service.js
```

Nombres de módulos en español, lowercase con underscore. Excepciones: `clienteAuth` (sin extensión), `aAuth` (sin extensión), `categoria.routes.js` (singular).

## Seed por Defecto

```sql
-- Admin: admin@callejaspin.com / admin123
INSERT INTO usuarios (nombres, apellidos, email, password, rol)
VALUES ('Admin', 'Principal', 'admin@callejaspin.com',
  '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmF0xPJx4x6Y5qGqkfqy', 'ADMIN');
```

## Órdenes de Inicio

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Docker
docker compose up --build
```

## Problemas Identificados / Inconsistencias

- ⚠️ **schema.sql DESACTUALIZADO**: La BD real de Supabase tiene columnas muy diferentes. Ver sección "BD REAL" arriba.
- **Nombres de columnas**: `ventas.tipo` vs `tipo_venta` (schema usa `tipo`, BD real usa `tipo_venta`); `venta_detalle` vs `detalle_ventas`; `cuotas` vs `cuotas_credito`; `plan_separe` vs `planes_separe`
- **Controllers sin services**: la mayoría de los controllers hacen llamadas directas a Supabase en lugar de pasar por la capa service
- **Archivos inconsistente**: `clienteAuth` y `aAuth` sin extensión `.js`
- **Frontend**: Creditos.jsx es solo tabla de solo lectura (pendiente agregar gestión); Reportes.jsx muestra JSON crudo
- **Express 5**: usa Express 5 (express@^5.2.1), los middlewares de error funcionan distinto
- **Ruta delete en productos**: elimina de tablas adicionales manualmente (repuestos, ropa, miscelanea, belleza)
- **Migración pendiente**: `database/migration_add_columns.sql` debe ejecutarse en el SQL Editor de Supabase para añadir `venta_id`, `metodo_pago`, `estado`, `observacion` a la tabla `pagos`

## Orden de Construcción del Sistema (Completado)

1. ✅ Usuarios — modulo completo
2. ✅ Login — auth con JWT
3. ✅ Roles — middleware de roles
4. ✅ Clientes — CRUD + login cliente
5. ✅ Categorías — CRUD
6. ✅ Productos — CRUD + tipos adicionales
7. ✅ Inventario — movimientos + ajuste stock
8. ✅ Ventas — 3 tipos (contado/crédito/separe) + anulación
9. ✅ Créditos — cuotas, abonos, saldos
10. ✅ Plan Separe — abonos, entrega al completar
11. ✅ Pagos — registro, consulta, flujo aprobación (cliente solicita → staff aprueba/rechaza)
12. ✅ Reportes — 4 reportes
13. ✅ Dashboard — resumen + evolución mensual
14. ✅ Frontend — React completo con sidebar, CRUDs, stores
15. ✅ Deploy — Dockerfile + docker-compose + nginx

## Extras Implementados

- **Pagos Electrónicos con Flujo de Aprobación**: Clientes pagan cuotas vía Nequi, Bancolombia, etc. Suben comprobante → staff aprueba/rechaza → actualiza saldo y cuotas.
- **Pago en Efectivo por Admin**: Staff puede registrar pagos manuales desde la interfaz Pagos → "Pago en efectivo", seleccionando cliente y crédito.

## Regla Principal — Checklist por Módulo

- [x] Tabla creada en schema.sql
- [x] RLS policy creada
- [x] Route montada en app.js
- [x] Controller implementado
- [x] Validaciones básicas
- [ ] Prueba Postman documentada
- [ ] Endpoints documentados formalmente

## Flujo de Pago Electrónico — Resumen Visual

```
CLIENTE                             STAFF
   │                                  │
   ├─ Elige cuota a pagar             │
   ├─ Selecciona método (NEQUI,etc)   │
   ├─ Sube foto del comprobante       │
   ├─ Envía solicitud ────────────────┤
   │                                  ├─ Ve solicitud pendiente
   │                                  ├─ Revisa comprobante
   │                                  ├─ [APROBAR] → Actualiza crédito + cuotas
   │                   ───────────────┤  [RECHAZAR] → Marca rechazado con motivo
   ├─ Ve estado de su solicitud       │
   │  (PENDIENTE/APROBADO/RECHAZADO)  │

--- Pago en Efectivo (Staff directo) ---
STAFF
   ├─ Va a Pagos > "Pago en efectivo"
   ├─ Selecciona cliente (carga créditos vía GET /clientes/:id/creditos)
   ├─ Selecciona crédito, ingresa monto
   ├─ [Registrar] → Crea pago APROBADO + descuenta saldo + actualiza cuotas
```
