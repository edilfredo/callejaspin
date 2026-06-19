const supabase = require('./config/supabase');
const bcrypt = require('bcrypt');

async function seed() {
  const password = await bcrypt.hash('admin123', 10);

  const { data, error } = await supabase
    .from('usuarios')
    .insert([{
      nombres: 'Admin',
      apellidos: 'Principal',
      email: 'admin@callejaspin.com',
      password,
      rol: 'ADMIN',
      estado: true
    }])
    .select('id, nombres, apellidos, email, rol');

  if (error) {
    if (error.code === '23505') {
      console.log('El usuario admin ya existe');
    } else {
      console.error('Error al crear admin:', error.message);
    }
    return;
  }

  console.log('Usuario admin creado:', data[0]);
  console.log('Email: admin@callejaspin.com');
  console.log('Password: admin123');
}

seed();
