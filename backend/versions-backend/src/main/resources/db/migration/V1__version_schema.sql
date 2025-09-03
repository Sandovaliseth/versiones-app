-- ==========================================================
-- V1__version_schema.sql
-- Tabla: version
--
-- Propósito:
--   - Representa cada release de software.
--   - Centraliza las relaciones con otros módulos.
--
-- Relación:
--   - 1:N con artefacto (cada versión tiene múltiples artefactos).
--   - 1:N con borrador (cada versión puede tener varios borradores).
--   - 1:N con evento_auditoria (auditoría ligada a la versión).
--   - 1:N con job_queue (trabajos encolados de la versión).
-- ==========================================================

CREATE TABLE IF NOT EXISTS version (
  id TEXT PRIMARY KEY,
  cliente TEXT NOT NULL,
  nombre TEXT NOT NULL,
  numero_version TEXT NOT NULL,
  build_yyyymmdd TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('Draft','Ready','Published','Sealed')),
  responsable TEXT NOT NULL,
  correlation_id TEXT,
  idempotency_key TEXT,
  branch TEXT,
  release_notes_path TEXT,
  creado_en TEXT NOT NULL,
  actualizado_en TEXT
);
