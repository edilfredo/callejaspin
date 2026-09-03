const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

//  CORS ya maneja OPTIONS automáticamente

// JSON middleware
app.use(express.json());

// archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// rutas públicas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/test', require('./routes/test.routes'));

// rutas protegidas
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/categorias', require('./routes/categoria.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/inventario', require('./routes/inventario.routes'));
app.use('/api/ventas', require('./routes/ventas.routes'));
app.use('/api/creditos', require('./routes/creditos.routes'));
app.use('/api/plan-separe', require('./routes/plan_separe.routes'));
app.use('/api/pagos', require('./routes/pagos.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Ruta raíz informativa (evita "Cannot GET /")
app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'API funcionando' });
});

// Servir frontend compilado (despliegue unificado en Render)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA: cualquier ruta no capturada por la API devuelve index.html (Express 5 usa *splat)
  app.get('*splat', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

module.exports = app;