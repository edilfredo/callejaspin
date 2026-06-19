const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'API funcionando' });
});

// Rutas públicas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/test', require('./routes/test.routes'));

// Rutas protegadas
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