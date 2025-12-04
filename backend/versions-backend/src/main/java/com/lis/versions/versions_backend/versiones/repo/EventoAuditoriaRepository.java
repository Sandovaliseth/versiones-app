package com.lis.versions.versions_backend.versiones.repo;

import com.lis.versions.versions_backend.versiones.domain.EventoAuditoriaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventoAuditoriaRepository extends JpaRepository<EventoAuditoriaEntity, String> {
    List<EventoAuditoriaEntity> findByVersionIdOrderByTimestampAsc(String versionId);
}
