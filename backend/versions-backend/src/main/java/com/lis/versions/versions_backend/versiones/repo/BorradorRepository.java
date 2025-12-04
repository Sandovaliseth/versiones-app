package com.lis.versions.versions_backend.versiones.repo;

import com.lis.versions.versions_backend.versiones.domain.BorradorEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BorradorRepository extends JpaRepository<BorradorEntity, String> {
}
