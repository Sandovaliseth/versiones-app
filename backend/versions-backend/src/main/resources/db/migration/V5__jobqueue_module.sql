-- ==========================================================
-- V5__jobqueue_module.sql
-- Tabla: job_queue
--
-- Propósito:
--   - Manejar la cola de trabajos automáticos ligados a releases.
--   - Ejemplos: copiar artefactos, calcular MD5, generar evidencias.
--
-- Relación:
--   - N:1 con version (cada job pertenece a una versión).
-- ==========================================================

CREATE TABLE IF NOT EXISTS job_queue (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'COPY_ARTIFACTS','COMPUTE_MD5','GEN_OUTBOX',
    'CAPTURE_WIKI_SCREENSHOT','PACKAGE_EVIDENCE'
  )),
  job_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','RUNNING','OK','ERROR')),
  priority TEXT NOT NULL CHECK (priority IN ('LOW','NORMAL','HIGH')),
  attempt INTEGER DEFAULT 0,
  output_json TEXT,
  error_msg TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (version_id) REFERENCES version(id)
);
