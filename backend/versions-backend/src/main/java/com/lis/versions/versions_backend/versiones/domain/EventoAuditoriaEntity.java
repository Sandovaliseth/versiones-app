package com.lis.versions.versions_backend.versiones.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "evento_auditoria")
public class EventoAuditoriaEntity {
    @Id
    private String id;

    @Column(name = "version_id", nullable = false)
    private String versionId;

    @Column(nullable = false)
    private String accion;

    @Column(nullable = false)
    private String actor;

    @Column(name = "ip_host")
    private String ipHost;

    @Column
    private String detalles;

    @Column(nullable = false)
    private String timestamp;

    public EventoAuditoriaEntity() {}

    public EventoAuditoriaEntity(String id, String versionId, String accion, String actor, String ipHost, String detalles, String timestamp) {
        this.id = id;
        this.versionId = versionId;
        this.accion = accion;
        this.actor = actor;
        this.ipHost = ipHost;
        this.detalles = detalles;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVersionId() { return versionId; }
    public void setVersionId(String versionId) { this.versionId = versionId; }
    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getIpHost() { return ipHost; }
    public void setIpHost(String ipHost) { this.ipHost = ipHost; }
    public String getDetalles() { return detalles; }
    public void setDetalles(String detalles) { this.detalles = detalles; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
