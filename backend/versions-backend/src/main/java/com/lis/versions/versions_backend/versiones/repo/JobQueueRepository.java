package com.lis.versions.versions_backend.versiones.repo;

import com.lis.versions.versions_backend.versiones.domain.JobQueueEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobQueueRepository extends JpaRepository<JobQueueEntity, String> {
    boolean existsByJobKey(String jobKey);
}
