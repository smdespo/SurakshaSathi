package com.surakshasathi.backend.Repository;

import com.surakshasathi.backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportRepo extends JpaRepository<Report, UUID> {
    Optional<Report> findByTrackingToken(String trackingToken);
    // surakshasathi/backend/Repository/ReportRepo.java
// Add this method to your existing repository interface:
    List<Report> findByIpHashAndCreatedAtAfter(String ipHash, java.time.LocalDateTime time);
}
