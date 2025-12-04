package com.lis.versions.versions_backend.common.api;

import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;

public class ApiError {
    private final String timestamp = OffsetDateTime.now().toString();
    private final int status;
    private final String error;
    private final String message;
    private final String path;

    public ApiError(HttpStatus status, String message, String path) {
        this.status = status.value();
        this.error = status.getReasonPhrase();
        this.message = message;
        this.path = path;
    }

    public String getTimestamp() { return timestamp; }
    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMessage() { return message; }
    public String getPath() { return path; }
}
