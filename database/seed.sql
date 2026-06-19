-- Seed: Crear usuario administrador por defecto
-- Ejecutar en Supabase SQL Editor
-- Password: admin123 (bcrypt hashed)

INSERT INTO usuarios (nombres, apellidos, email, password, rol)
VALUES (
  'Admin',
  'Principal',
  'admin@callejaspin.com',
  '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmF0xPJx4x6Y5qGqkfqy',
  'ADMIN'
)
ON CONFLICT (email) DO NOTHING;
