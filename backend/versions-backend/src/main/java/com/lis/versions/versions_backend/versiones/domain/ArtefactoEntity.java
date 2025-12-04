package com.lis.versions.versions_backend.versiones.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "artefacto")
public class ArtefactoEntity {
    @Id
    private String id;

    @Column(name = "version_id", nullable = false)
    private String versionId;

    @Column(nullable = false)
    private String tipo; // bin, pkg, doc

    @Column(nullable = false)
    private String rama; // base, aumento

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "nombre_final")
    private String nombreFinal;

    @Column(name = "ruta_destino")
    private String rutaDestino;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column
    private String md5;

    @Column(name = "uploaded_url")
    private String uploadedUrl;

    @Column(name = "creado_en", nullable = false)
    private String creadoEn;

    public ArtefactoEntity() {}

    public ArtefactoEntity(String id, String versionId, String tipo, String rama, String nombreOriginal, String nombreFinal,
                           String rutaDestino, Long sizeBytes, String md5, String uploadedUrl, String creadoEn) {
        this.id = id;
        this.versionId = versionId;
        this.tipo = tipo;
        this.rama = rama;
        this.nombreOriginal = nombreOriginal;
        this.nombreFinal = nombreFinal;
        this.rutaDestino = rutaDestino;
        this.sizeBytes = sizeBytes;
        this.md5 = md5;
        this.uploadedUrl = uploadedUrl;
        this.creadoEn = creadoEn;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVersionId() { return versionId; }
    public void setVersionId(String versionId) { this.versionId = versionId; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getRama() { return rama; }
    public void setRama(String rama) { this.rama = rama; }
    public String getNombreOriginal() { return nombreOriginal; }
    public void setNombreOriginal(String nombreOriginal) { this.nombreOriginal = nombreOriginal; }
    public String getNombreFinal() { return nombreFinal; }
    public void setNombreFinal(String nombreFinal) { this.nombreFinal = nombreFinal; }
    public String getRutaDestino() { return rutaDestino; }
    public void setRutaDestino(String rutaDestino) { this.rutaDestino = rutaDestino; }
    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
    public String getMd5() { return md5; }
    public void setMd5(String md5) { this.md5 = md5; }
    public String getUploadedUrl() { return uploadedUrl; }
    public void setUploadedUrl(String uploadedUrl) { this.uploadedUrl = uploadedUrl; }
    public String getCreadoEn() { return creadoEn; }
    public void setCreadoEn(String creadoEn) { this.creadoEn = creadoEn; }
}
