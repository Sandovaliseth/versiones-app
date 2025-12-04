package com.lis.versions.versions_backend.versiones.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "job_queue")
public class JobQueueEntity {
    @Id
    private String id;

    @Column(name = "version_id", nullable = false)
    private String versionId;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "job_key", nullable = false, unique = true)
    private String jobKey;

    @Column(name = "payload_json", length = 4000)
    private String payloadJson;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "priority", nullable = false)
    private String priority;

    @Column(name = "attempt", nullable = false)
    private Integer attempt;

    @Column(name = "output_json", length = 4000)
    private String outputJson;

    @Column(name = "error_msg", length = 1000)
    private String errorMsg;

    @Column(name = "created_at", nullable = false)
    private String createdAt;

    @Column(name = "updated_at", nullable = false)
    private String updatedAt;

    public JobQueueEntity() {}

    public JobQueueEntity(String id, String versionId, String type, String jobKey, String payloadJson, String status, String priority, Integer attempt, String outputJson, String errorMsg, String createdAt, String updatedAt) {
        this.id = id;
        this.versionId = versionId;
        this.type = type;
        this.jobKey = jobKey;
        this.payloadJson = payloadJson;
        this.status = status;
        this.priority = priority;
        this.attempt = attempt;
        this.outputJson = outputJson;
        this.errorMsg = errorMsg;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVersionId() { return versionId; }
    public void setVersionId(String versionId) { this.versionId = versionId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getJobKey() { return jobKey; }
    public void setJobKey(String jobKey) { this.jobKey = jobKey; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public Integer getAttempt() { return attempt; }
    public void setAttempt(Integer attempt) { this.attempt = attempt; }
    public String getOutputJson() { return outputJson; }
    public void setOutputJson(String outputJson) { this.outputJson = outputJson; }
    public String getErrorMsg() { return errorMsg; }
    public void setErrorMsg(String errorMsg) { this.errorMsg = errorMsg; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
