package com.surakshasathi.backend.Controller;

import com.surakshasathi.backend.Service.ReportService;
import com.surakshasathi.backend.dto.ReportReqDTO;
import com.surakshasathi.backend.dto.ReportResDTO;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin("*")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping(value = "/create", consumes = {"multipart/form-data"})
    public  ResponseEntity<Map<String, String>> createReport(
            @RequestParam("incidentType") String incidentType,
            @RequestParam("description") String description,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam(value = "files", required = false)List<MultipartFile> files, HttpServletRequest request
            )
    {
        Map<String, String> result = reportService.submitReport(
                incidentType, description, latitude, longitude, files, request
        );
        return ResponseEntity.ok(result);
    }
    @GetMapping("/track/{trackingToken}")
    public ReportResDTO trackReport(@PathVariable String trackingToken) {
        return reportService.trackReport(trackingToken);
    }

}
