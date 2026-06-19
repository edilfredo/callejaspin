const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const usuariosService = {

  async crear({ nombres, apellidos, email, password, rol }) {
    const passwordEncriptada = await bcrypt.hash(password, SALT_ROUNDS);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nombres, apellidos, email, password: passwordEncriptada, rol }])
      .select('id, nombres, apellidos, email, rol, estado, created_at');

    if (error) throw error;
    return data[0];
  },

  async listar() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombres, apellidos, email, rol, estado, created_at');

    if (error) throw error;
    return data;
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombres, apellidos, email, rol, estado, created_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id, campos) {
    const datosActualizar = { ...campos };

    if (datosActualizar.password) {
      datosActualizar.password = await bcrypt.hash(datosActualizar.password, SALT_ROUNDS);
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(datosActualizar)
      .eq('id', id)
      .select('id, nombres, apellidos, email, rol, estado, created_at');

    if (error) throw error;
    return data[0];
  },

  async eliminar(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw error;
    return data[0];
  }

};

module.exports = usuariosService;
