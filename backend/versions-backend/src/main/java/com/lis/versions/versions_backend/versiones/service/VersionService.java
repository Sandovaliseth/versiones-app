package com.lis.versions.versions_backend.versiones.service;

import com.lis.versions.versions_backend.versiones.api.Dtos;
import com.lis.versions.versions_backend.versiones.domain.*;
import com.lis.versions.versions_backend.versiones.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class VersionService {
    private final VersionRepository versionRepository;
    private final ArtefactoRepository artefactoRepository;
    private final EventoAuditoriaRepository eventoAuditoriaRepository;
    private final JobQueueRepository jobQueueRepository;
    private final BorradorRepository borradorRepository;

    public VersionService(VersionRepository versionRepository,
                          ArtefactoRepository artefactoRepository,
                          EventoAuditoriaRepository eventoAuditoriaRepository,
                          JobQueueRepository jobQueueRepository,
                          BorradorRepository borradorRepository) {
        this.versionRepository = versionRepository;
        this.artefactoRepository = artefactoRepository;
        this.eventoAuditoriaRepository = eventoAuditoriaRepository;
        this.jobQueueRepository = jobQueueRepository;
        this.borradorRepository = borradorRepository;
    }

    private static String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    @Transactional
    public VersionEntity registrar(Dtos.RegistrarVersionRequest req) {
        if (versionRepository.existsByClienteAndNombreAndNumeroVersionAndBuildYyyymmdd(req.cliente, req.nombre, req.numeroVersion, req.buildYyyymmdd)) {
            throw new ServiceException(409, "VERSION_DUPLICADA", "Ya existe una versión con los mismos parámetros");
        }
        var v = new VersionEntity(
                UUID.randomUUID().toString(),
                req.cliente,
                req.nombre,
                req.numeroVersion,
                req.buildYyyymmdd,
                VersionEstado.Draft,
                req.responsable,
                req.branch,
                null,
                now(),
                now()
        );
        versionRepository.save(v);
        audit(v.getId(), "version_registrada", req.responsable, "Registro de versión en estado Draft");
        return v;
    }

    @Transactional
    public ArtefactoEntity adjuntarArtefacto(String versionId, Dtos.AdjuntarArtefactoRequest req, String actor) {
        var version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ServiceException(404, "VERSION_NO_ENCONTRADA", "Versión no encontrada"));
        if (!(version.getEstado() == VersionEstado.Draft || version.getEstado() == VersionEstado.Ready)) {
            throw new ServiceException(422, "ESTADO_INVALIDO", "Solo se pueden adjuntar artefactos en Draft o Ready");
        }
        validarTipoYRama(req.tipo, req.rama);
        var a = new ArtefactoEntity(
                UUID.randomUUID().toString(),
                versionId,
                req.tipo,
                req.rama,
                req.nombreOriginal,
                req.nombreFinal,
                req.rutaDestino,
                req.sizeBytes,
                req.md5,
                req.uploadedUrl,
                now()
        );
        artefactoRepository.save(a);
        audit(versionId, "artefacto_adjuntado", actor, "tipo=" + req.tipo + ", rama=" + req.rama + ", nombre=" + req.nombreOriginal);
        return a;
    }

    private void validarTipoYRama(String tipo, String rama) {
        if (!("bin".equals(tipo) || "pkg".equals(tipo) || "doc".equals(tipo))) {
            throw new ServiceException(422, "TIPO_INVALIDO", "Tipo de artefacto inválido");
        }
        if (!("base".equals(rama) || "aumento".equals(rama))) {
            throw new ServiceException(422, "RAMA_INVALIDA", "Rama inválida");
        }
    }

    @Transactional
    public VersionEntity validar(String versionId, String actor) {
        var version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ServiceException(404, "VERSION_NO_ENCONTRADA", "Versión no encontrada"));
        if (version.getEstado() != VersionEstado.Draft) {
            throw new ServiceException(422, "ESTADO_INVALIDO", "Solo se valida desde Draft");
        }
        var arts = artefactoRepository.findByVersionId(versionId);
        if (arts.isEmpty()) {
            throw new ServiceException(422, "SIN_ARTEFACTOS", "Debe adjuntar artefactos antes de validar");
        }
        // Regla simple: al menos un bin por rama si hay dos ramas
        boolean tieneBase = arts.stream().anyMatch(a -> "base".equals(a.getRama()) && "bin".equals(a.getTipo()));
        boolean tieneAum = arts.stream().anyMatch(a -> "aumento".equals(a.getRama()) && "bin".equals(a.getTipo()));
        if (!(tieneBase && tieneAum)) {
            throw new ServiceException(422, "REGLA_ARTEFACTOS", "Se requiere al menos un bin en base y uno en aumento");
        }
        version.setEstado(VersionEstado.Ready);
        version.setActualizadoEn(now());
        versionRepository.save(version);
        audit(versionId, "version_validada", actor, "Estado → Ready");
        return version;
    }

    @Transactional
    public VersionEntity publicar(String versionId, String actor) {
        var version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ServiceException(404, "VERSION_NO_ENCONTRADA", "Versión no encontrada"));
        if (version.getEstado() != VersionEstado.Ready) {
            throw new ServiceException(422, "ESTADO_INVALIDO", "Solo se publica desde Ready");
        }
        // Encolar trabajos mínimos
        enqueue(versionId, "COPY_ARTIFACTS", "copy_" + versionId);
        enqueue(versionId, "COMPUTE_MD5", "md5_" + versionId);
        enqueue(versionId, "GEN_OUTBOX", "outbox_" + versionId);

        // Generar outbox local inmediato (CU-5 local)
        generarOutboxLocal(version);

        version.setEstado(VersionEstado.Published);
        version.setActualizadoEn(now());
        versionRepository.save(version);
        audit(versionId, "version_publicada", actor, "Estado → Published y outbox local generado");
        return version;
    }

    private void enqueue(String versionId, String type, String jobKey) {
        if (jobQueueRepository.existsByJobKey(jobKey)) return;
        var j = new JobQueueEntity(
                UUID.randomUUID().toString(),
                versionId,
                type,
                jobKey,
                null,
                "PENDING",
                "NORMAL",
                0,
                null,
                null,
                now(),
                now()
        );
        jobQueueRepository.save(j);
    }

    private void generarOutboxLocal(VersionEntity v) {
        try {
            Path outbox = Path.of("data", "outbox");
            Files.createDirectories(outbox);
            String asunto = "SOLICITUD DE PUBLICACIÓN " + v.getNombre() + v.getNumeroVersion() + " _ " + v.getBuildYyyymmdd();
            String cuerpo = "Publicación de versión " + v.getNombre() + v.getNumeroVersion() + " (build " + v.getBuildYyyymmdd() + ")";
            Path eml = outbox.resolve("pub_" + v.getId() + ".eml");
            Path md = outbox.resolve("release-notes_" + v.getId() + ".md");
            Files.writeString(eml, "Subject: " + asunto + "\n\n" + cuerpo);
            Files.writeString(md, "# Release Notes\n\n- Cliente: " + v.getCliente() + "\n- Version: " + v.getNumeroVersion() + "\n- Build: " + v.getBuildYyyymmdd());
            // persist borrador
            var b = new BorradorEntity(UUID.randomUUID().toString(), v.getId(), "outbox", asunto, cuerpo, null, "DRAFT", null, now());
            borradorRepository.save(b);
        } catch (Exception e) {
            throw new ServiceException(502, "OUTBOX_ERROR", "No se pudo generar outbox local: " + e.getMessage());
        }
    }

    private void audit(String versionId, String accion, String actor, String detalles) {
        var ev = new EventoAuditoriaEntity(UUID.randomUUID().toString(), versionId, accion, actor, null, detalles, now());
        eventoAuditoriaRepository.save(ev);
    }

    public static class ServiceException extends RuntimeException {
        public final int http;
        public final String code;
        public ServiceException(int http, String code, String message) { super(message); this.http = http; this.code = code; }
    }
}
