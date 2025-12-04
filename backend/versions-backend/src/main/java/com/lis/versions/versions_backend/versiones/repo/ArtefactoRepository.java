package com.lis.versions.versions_backend.versiones.repo;

import com.lis.versions.versions_backend.versiones.domain.ArtefactoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArtefactoRepository extends JpaRepository<ArtefactoEntity, String> {
    List<ArtefactoEntity> findByVersionId(String versionId);
}