package com.surakshasathi.backend.Service;

import com.surakshasathi.backend.Repository.ReportRepo;
import com.surakshasathi.backend.dto.ReportReqDTO;
import com.surakshasathi.backend.dto.ReportResDTO;
import com.surakshasathi.backend.dto.StatusUpdateDTO;
import com.surakshasathi.backend.entity.Report;
import com.surakshasathi.backend.enums.ReportStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReportService {

    @Autowired
    private ReportRepo reportRepo;

    public String createReport(ReportReqDTO dto) {

        Report report = new Report();

        report.setTitle(dto.getTitle());

        report.setDescription(dto.getDescription());

        report.setIncidentType(dto.getIncidentType());

        report.setLatitude(dto.getLatitude());

        report.setLongitude(dto.getLongitude());

        report.setSeverity(dto.getSeverity());

        report.setStatus(ReportStatus.PENDING);

        report.setCreatedAt(LocalDateTime.now());

        String token = generateTrackingToken();

        report.setTrackingToken(token);

        reportRepo.save(report);

        return token;
    }

    private String generateTrackingToken() {

        return "REPORT-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();
    }

    public ReportResDTO trackReport(String trackingToken) {
        Report report = reportRepo
                .findByTrackingToken(trackingToken)
                .orElseThrow(() ->
                        new RuntimeException("Report not found"));

        ReportResDTO dto = new ReportResDTO();

        dto.setTitle(report.getTitle());
        dto.setDescription(report.getDescription());
        dto.setTrackingToken(report.getTrackingToken());
        dto.setIncidentType(report.getIncidentType());
        dto.setLatitude(report.getLatitude());
        dto.setLongitude(report.getLongitude());
        dto.setSeverity(report.getSeverity());
        dto.setStatus(report.getStatus());
        dto.setCreatedAt(report.getCreatedAt());

        return dto;
    }

    public List<ReportResDTO> getAllReports() {
List<Report> reports = reportRepo.findAll();

return reports.stream()
        .map(report -> {
            ReportResDTO dto = new ReportResDTO();

            dto.setTitle(report.getTitle());
            dto.setDescription(report.getDescription());
            dto.setTrackingToken(report.getTrackingToken());
            dto.setIncidentType(report.getIncidentType());
            dto.setLatitude(report.getLatitude());
            dto.setLongitude(report.getLongitude());
            dto.setSeverity(report.getSeverity());
            dto.setStatus(report.getStatus());
            dto.setCreatedAt(report.getCreatedAt());

            return dto;
        }).toList();
    }
    public String updateReportStatus(String trackingToken, StatusUpdateDTO dto) {
        Report report = reportRepo.findByTrackingToken(trackingToken).orElseThrow(()->new RuntimeException("Report Not Found"));

        report.setStatus(dto.getReportStatus());

        reportRepo.save(report);

        return "Status Updated";
    }
}
