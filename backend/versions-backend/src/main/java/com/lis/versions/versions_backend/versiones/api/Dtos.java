package com.lis.versions.versions_backend.versiones.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class Dtos {
    public static class RegistrarVersionRequest {
        @NotBlank public String cliente;
        @NotBlank public String nombre;
        @NotBlank public String numeroVersion; // semver text
        @NotBlank @Pattern(regexp = "^\\d{8}$") public String buildYyyymmdd;
        @NotBlank public String responsable;
        public String branch;
    }

    public static class AdjuntarArtefactoRequest {
        @NotBlank public String tipo; // bin|pkg|doc
        @NotBlank public String rama; // base|aumento
        @NotBlank public String nombreOriginal;
        public String nombreFinal;
        public String rutaDestino;
        public Long sizeBytes;
        public String md5;
        public String uploadedUrl;
    }

    public record ApiError(String code, String message) {}
}
