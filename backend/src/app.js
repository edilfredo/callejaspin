const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://callejaspin.vercel.app')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
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

module.exports = app;