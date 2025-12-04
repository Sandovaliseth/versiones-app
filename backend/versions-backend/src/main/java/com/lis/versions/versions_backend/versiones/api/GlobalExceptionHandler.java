package com.lis.versions.versions_backend.versiones.api;

import com.lis.versions.versions_backend.versiones.service.VersionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import static com.lis.versions.versions_backend.versiones.api.Dtos.*;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        var msg = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .findFirst().orElse("Validación inválida");
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new ApiError("VALIDATION_ERROR", msg));
    }

    @ExceptionHandler(VersionService.ServiceException.class)
    public ResponseEntity<ApiError> handleService(VersionService.ServiceException ex) {
        return ResponseEntity.status(ex.http).body(new ApiError(ex.code, ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex) {
        return ResponseEntity.status(500).body(new ApiError("INTERNAL_ERROR", ex.getMessage()));
    }
}
