package com.lis.versions.versions_backend.versiones.api;

import com.lis.versions.versions_backend.versiones.api.Dtos.AdjuntarArtefactoRequest;
import com.lis.versions.versions_backend.versiones.api.Dtos.RegistrarVersionRequest;
import com.lis.versions.versions_backend.versiones.domain.ArtefactoEntity;
import com.lis.versions.versions_backend.versiones.domain.VersionEntity;
import com.lis.versions.versions_backend.versiones.service.VersionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/versiones")
public class VersionesController {

    private final VersionService service;

    public VersionesController(VersionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<VersionEntity> registrar(@Valid @RequestBody RegistrarVersionRequest req) {
        var v = service.registrar(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(v);
    }

    @PostMapping("/{id}/artefactos")
    public ResponseEntity<ArtefactoEntity> adjuntar(@PathVariable("id") String id,
                                                    @Valid @RequestBody AdjuntarArtefactoRequest req,
                                                    @RequestHeader(value = "X-Actor", required = false) String actor) {
        var a = service.adjuntarArtefacto(id, req, actor != null ? actor : "system");
        return ResponseEntity.status(HttpStatus.CREATED).body(a);
    }

    @PostMapping("/{id}/validar")
    public ResponseEntity<VersionEntity> validar(@PathVariable("id") String id,
                                                 @RequestHeader(value = "X-Actor", required = false) String actor) {
        var v = service.validar(id, actor != null ? actor : "system");
        return ResponseEntity.ok(v);
    }

    @PostMapping("/{id}/publicar")
    public ResponseEntity<VersionEntity> publicar(@PathVariable("id") String id,
                                                  @RequestHeader(value = "X-Actor", required = false) String actor) {
        var v = service.publicar(id, actor != null ? actor : "system");
        return ResponseEntity.ok(v);
    }
}
