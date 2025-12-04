package com.lis.versions.versions_backend.versiones.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "borrador")
public class BorradorEntity {
    @Id
    private String id;

    @Column(name = "version_id", nullable = false)
    private String versionId;

    @Column(nullable = false)
    private String canal; // outbox, outlook, teams

    @Column(nullable = false)
    private String asunto;

    @Column(nullable = false, length = 4000)
    private String cuerpo;

    @Column(name = "thread_id")
    private String threadId;

    @Column(nullable = false)
    private String status; // DRAFT, SENT, FAILED

    @Column(name = "evidence_zip_path")
    private String evidenceZipPath;

    @Column(name = "creado_en", nullable = false)
    private String creadoEn;

    public BorradorEntity() {}

    public BorradorEntity(String id, String versionId, String canal, String asunto, String cuerpo, String threadId, String status, String evidenceZipPath, String creadoEn) {
        this.id = id;
        this.versionId = versionId;
        this.canal = canal;
        this.asunto = asunto;
        this.cuerpo = cuerpo;
        this.threadId = threadId;
        this.status = status;
        this.evidenceZipPath = evidenceZipPath;
        this.creadoEn = creadoEn;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVersionId() { return versionId; }
    public void setVersionId(String versionId) { this.versionId = versionId; }
    public String getCanal() { return canal; }
    public void setCanal(String canal) { this.canal = canal; }
    public String getAsunto() { return asunto; }
    public void setAsunto(String asunto) { this.asunto = asunto; }
    public String getCuerpo() { return cuerpo; }
    public void setCuerpo(String cuerpo) { this.cuerpo = cuerpo; }
    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getEvidenceZipPath() { return evidenceZipPath; }
    public void setEvidenceZipPath(String evidenceZipPath) { this.evidenceZipPath = evidenceZipPath; }
    public String getCreadoEn() { return creadoEn; }
    public void setCreadoEn(String creadoEn) { this.creadoEn = creadoEn; }
}
