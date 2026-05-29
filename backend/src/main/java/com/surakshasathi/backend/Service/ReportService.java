package com.surakshasathi.backend.Service;

import com.surakshasathi.backend.Repository.ReportRepo;
import com.surakshasathi.backend.dto.ReportReqDTO;
import com.surakshasathi.backend.dto.ReportResDTO;
import com.surakshasathi.backend.dto.StatusUpdateDTO;
import com.surakshasathi.backend.entity.Evidence;
import com.surakshasathi.backend.entity.Report;
import com.surakshasathi.backend.enums.ReportStatus;
import com.surakshasathi.backend.util.PrivacyAndAntiSpamUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Builder
public class ReportService {

    private final PrivacyAndAntiSpamUtil antiSpamUtil=new PrivacyAndAntiSpamUtil();
    private final ReportRepo reportRepo;
    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

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



    public List<ReportResDTO> getAllReports() {
List<Report> reports = reportRepo.findAll();

return reportRepo.findAll().stream()
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
    public Map<String, String> submitReport(
            String incidentType,
            String description,
            Double lat,
            Double lon,
            List<MultipartFile> files,
            HttpServletRequest request
    ) {
        // 1. IP Privacy Protection Hashing
        String rawIp = request.getRemoteAddr();
        String ipHash = antiSpamUtil.hashIpAddress(rawIp);

        // 2. Anti-Spam Trust Score Engine
        int calculatedScore = 100;

        // Rule A: Frequency Check (3 minutes window)
        List<Report> recentReports = reportRepo.findByIpHashAndCreatedAtAfter(ipHash, LocalDateTime.now().minusMinutes(3));
        if (!recentReports.isEmpty()) {
            calculatedScore -= 40;
        }
        // Rule B: Detail Verification Check
        if (description == null || description.length() < 10) {
            calculatedScore -= 20;
        }
        // Rule C: Malicious/Spam Keyword Check
        if (antiSpamUtil.containsAbusiveOrSpamKeywords(description)) {
            calculatedScore -= 30;
        }


        ReportStatus reportStatus = ReportStatus.PENDING;
        if (calculatedScore < 50) {
            reportStatus = ReportStatus.SPAM;
        }

        // 3. Create Uniform Tracking ID
        String trackingId = "SR-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();


        Report report = new Report();
        report.setTrackingToken(trackingId);
        report.setIncidentType(incidentType);
        report.setDescription(description);
        report.setLatitude(lat);
        report.setLongitude(lon);
        report.setStatus(reportStatus);
        report.setCreatedAt(LocalDateTime.now());
        report.setTrustScore(calculatedScore);
        report.setIpHash(ipHash);
        report.setEvidenceList(new ArrayList<>());

        // 4. Handle Physical Media Assets (If provided)
        if (files != null && !files.isEmpty()) {
            try {
                File dir = new File(UPLOAD_DIR);
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;

                    String uniqueFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(UPLOAD_DIR + uniqueFileName);
                    Files.copy(file.getInputStream(), filePath);

                    Evidence evidence = Evidence.builder()
                            .fileName(file.getOriginalFilename())
                            .fileUrl("/uploads/" + uniqueFileName)
                            .fileType(file.getContentType())
                            .report(report)
                            .build();

                    report.getEvidenceList().add(evidence);
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to store media evidence files: " + e.getMessage());
            }
        }

        // FIX 1: Moved OUTSIDE the file-checking loop so ALL reports are persisted properly!
        reportRepo.save(report);

        // FIX 3: Cast calculatedScore to String to avoid generic map compilation errors
        return Map.of(
                "trackingId", trackingId,
                "status", reportStatus.toString(),
                "trustScore", String.valueOf(calculatedScore)
        );
    }

    public ReportResDTO trackReport(
            String trackingToken
    ) {
        Report report = reportRepo.findByTrackingToken(trackingToken).orElseThrow(() -> new RuntimeException("Report Not Found"));
        ReportResDTO dto = new ReportResDTO();
        dto.setDescription(report.getDescription());
        dto.setTrackingToken(report.getTrackingToken()); // Map back gracefully to your DTO field names
        dto.setIncidentType(report.getIncidentType());
        dto.setLatitude(report.getLatitude());
        dto.setLongitude(report.getLongitude());
        dto.setStatus(report.getStatus());
        dto.setCreatedAt(report.getCreatedAt());

        return dto;
    }
}
