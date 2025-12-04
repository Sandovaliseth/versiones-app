package com.lis.versions.versions_backend.versiones.repo;

import com.lis.versions.versions_backend.versiones.domain.VersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VersionRepository extends JpaRepository<VersionEntity, String> {
    boolean existsByClienteAndNombreAndNumeroVersionAndBuildYyyymmdd(String cliente, String nombre, String numeroVersion, String buildYyyymmdd);
    Optional<VersionEntity> findByClienteAndNombreAndNumeroVersionAndBuildYyyymmdd(String cliente, String nombre, String numeroVersion, String buildYyyymmdd);
}
