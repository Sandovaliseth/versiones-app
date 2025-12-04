-- Schema initialization for Versiones app per docs
-- Use SQLite with constraints and CHECK values

CREATE TABLE IF NOT EXISTS version (
    id TEXT PRIMARY KEY,
    cliente TEXT NOT NULL,
    nombre TEXT NOT NULL,
    numero_version TEXT NOT NULL,
    build_yyyymmdd TEXT NOT NULL CHECK(length(build_yyyymmdd) = 8),
    estado TEXT NOT NULL CHECK(estado IN ('Draft','Ready','Published','Sealed')),
    responsable TEXT NOT NULL,
    branch TEXT,
    release_notes_path TEXT,
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL,
    UNIQUE (cliente, nombre, numero_version, build_yyyymmdd)
);

CREATE TABLE IF NOT EXISTS artefacto (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('bin','pkg','doc')),
    rama TEXT NOT NULL CHECK(rama IN ('base','aumento')),
    nombre_original TEXT NOT NULL,
    nombre_final TEXT,
    ruta_destino TEXT,
    size_bytes INTEGER,
    md5 TEXT,
    uploaded_url TEXT,
    creado_en TEXT NOT NULL,
    FOREIGN KEY (version_id) REFERENCES version(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS borrador (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    canal TEXT NOT NULL CHECK(canal IN ('outbox','outlook','teams')),
    asunto TEXT NOT NULL,
    cuerpo TEXT NOT NULL,
    thread_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('DRAFT','SENT','FAILED')),
    evidence_zip_path TEXT,
    creado_en TEXT NOT NULL,
    FOREIGN KEY (version_id) REFERENCES version(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evento_auditoria (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    actor TEXT NOT NULL,
    ip_host TEXT,
    detalles TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (version_id) REFERENCES version(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_queue (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('COPY_ARTIFACTS','COMPUTE_MD5','GEN_OUTBOX','CAPTURE_WIKI_SCREENSHOT','PACKAGE_EVIDENCE')),
    job_key TEXT NOT NULL,
    payload_json TEXT,
    status TEXT NOT NULL CHECK(status IN ('PENDING','RUNNING','OK','ERROR')),
    priority TEXT NOT NULL CHECK(priority IN ('LOW','NORMAL','HIGH')),
    attempt INTEGER NOT NULL DEFAULT 0,
    output_json TEXT,
    error_msg TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (version_id) REFERENCES version(id) ON DELETE CASCADE,
    UNIQUE (job_key)
);
