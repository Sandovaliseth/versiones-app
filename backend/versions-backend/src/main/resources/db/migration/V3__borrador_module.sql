-- ==========================================================
-- V3__borrador_module.sql
-- Tabla: borrador
--
-- Propósito:
--   - Controlar comunicaciones (correos, Teams, Outlook).
--   - Mantener trazabilidad de mensajes enviados o fallidos.
--
-- Relación:
--   - N:1 con version (cada borrador pertenece a una versión).
-- ==========================================================

CREATE TABLE IF NOT EXISTS borrador (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('outbox','outlook','teams')),
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  thread_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','SENT','FAILED')),
  evidence_zip_path TEXT,
  creado_en TEXT NOT NULL,
  FOREIGN KEY (version_id) REFERENCES version(id)
);
