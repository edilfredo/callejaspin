const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BUCKET = 'comprobantes';
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];

// Cliente admin para operaciones de storage (service_role)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.JWT_SECRET
);

/**
 * Sube un archivo a Supabase Storage y devuelve la URL pública.
 * @param {Object} file - Objeto de multer (con buffer, originalname, mimetype)
 * @param {string} carpeta - Subcarpeta dentro del bucket (ej: 'pagos')
 * @returns {Promise<string>} URL pública del archivo
 */
async function subirComprobante(file, carpeta = 'pagos') {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error('Formato no permitido. Use: jpg, png, gif, webp, pdf');
  }

  const nombre = `${carpeta}/${uuidv4()}${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(nombre, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw new Error('Error subiendo comprobante: ' + error.message);

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(nombre);

  return urlData.publicUrl;
}

module.exports = { subirComprobante, BUCKET };
