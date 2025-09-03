-- ==========================================================
-- V2__artefacto_module.sql
-- Tabla: artefacto
--
-- Propósito:
--   - Gestionar los artefactos generados por cada versión.
--   - Permite trazar archivos (binarios, paquetes, docs).
--
-- Relación:
--   - N:1 con version (cada artefacto pertenece a una versión).
-- ==========================================================

CREATE TABLE IF NOT EXISTS artefacto (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('bin','pkg','doc')),
  rama TEXT NOT NULL CHECK (rama IN ('base','aumento')),
  nombre_original TEXT NOT NULL,
  nombre_final TEXT NOT NULL,
  ruta_destino TEXT NOT NULL,
  size_bytes INTEGER,
  md5 TEXT,
  uploaded_url TEXT,
  creado_en TEXT NOT NULL,
  FOREIGN KEY (version_id) REFERENCES version(id)
);
