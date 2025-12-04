package com.lis.versions.versions_backend.versiones.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "version")
public class VersionEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String cliente;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "numero_version", nullable = false)
    private String numeroVersion;

    @Column(name = "build_yyyymmdd", nullable = false)
    private String buildYyyymmdd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VersionEstado estado;

    @Column(nullable = false)
    private String responsable;

    private String branch;

    @Column(name = "release_notes_path")
    private String releaseNotesPath;

    @Column(name = "creado_en", nullable = false)
    private String creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private String actualizadoEn;

    public VersionEntity() { }

    public VersionEntity(String id, String cliente, String nombre, String numeroVersion, String buildYyyymmdd,
                         VersionEstado estado, String responsable, String branch, String releaseNotesPath,
                         String creadoEn, String actualizadoEn) {
        this.id = id;
        this.cliente = cliente;
        this.nombre = nombre;
        this.numeroVersion = numeroVersion;
        this.buildYyyymmdd = buildYyyymmdd;
        this.estado = estado;
        this.responsable = responsable;
        this.branch = branch;
        this.releaseNotesPath = releaseNotesPath;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getNumeroVersion() { return numeroVersion; }
    public void setNumeroVersion(String numeroVersion) { this.numeroVersion = numeroVersion; }
    public String getBuildYyyymmdd() { return buildYyyymmdd; }
    public void setBuildYyyymmdd(String buildYyyymmdd) { this.buildYyyymmdd = buildYyyymmdd; }
    public VersionEstado getEstado() { return estado; }
    public void setEstado(VersionEstado estado) { this.estado = estado; }
    public String getResponsable() { return responsable; }
    public void setResponsable(String responsable) { this.responsable = responsable; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public String getReleaseNotesPath() { return releaseNotesPath; }
    public void setReleaseNotesPath(String releaseNotesPath) { this.releaseNotesPath = releaseNotesPath; }
    public String getCreadoEn() { return creadoEn; }
    public void setCreadoEn(String creadoEn) { this.creadoEn = creadoEn; }
    public String getActualizadoEn() { return actualizadoEn; }
    public void setActualizadoEn(String actualizadoEn) { this.actualizadoEn = actualizadoEn; }
}
