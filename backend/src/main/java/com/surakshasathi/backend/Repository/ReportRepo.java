package com.surakshasathi.backend.Repository;

import com.surakshasathi.backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportRepo extends JpaRepository<Report, UUID> {
    Optional<Report> findByTrackingToken(String trackingToken);
}
