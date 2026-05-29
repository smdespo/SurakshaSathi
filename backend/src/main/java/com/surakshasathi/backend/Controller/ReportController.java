package com.surakshasathi.backend.Controller;

import com.surakshasathi.backend.Service.ReportService;
import com.surakshasathi.backend.dto.ReportReqDTO;
import com.surakshasathi.backend.dto.ReportResDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin("*")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/create")
    public Map<String, String> createReport(
            @RequestBody ReportReqDTO dto
    ) {

        String token = reportService.createReport(dto);

        Map<String, String> response = new HashMap<>();

        response.put(
                "message",
                "Report submitted successfully"
        );

        response.put(
                "trackingToken",
                token
        );

        return response;
    }
    @GetMapping("/track/{trackingToken}")
    public ReportResDTO trackReport(@PathVariable String trackingToken) {
        return reportService.trackReport(trackingToken);
    }

}
