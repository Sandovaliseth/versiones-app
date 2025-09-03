-- ==========================================================
-- V4__auditoria_module.sql
-- Tabla: evento_auditoria
--
-- Propósito:
--   - Registrar cada acción realizada sobre una versión.
--   - Proveer trazabilidad completa para debugging y reportes.
--
-- Relación:
--   - N:1 con version (cada evento pertenece a una versión).
-- ==========================================================

CREATE TABLE IF NOT EXISTS evento_auditoria (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  accion TEXT NOT NULL,
  actor TEXT NOT NULL,
  ip_host TEXT,
  detalles TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (version_id) REFERENCES version(id)
);
