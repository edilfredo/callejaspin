-- Migración: agregar columna estado a clientes y categorias
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS estado BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.categorias
  ADD COLUMN IF NOT EXISTS estado BOOLEAN NOT NULL DEFAULT true;
