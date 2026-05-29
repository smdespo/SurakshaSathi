package com.surakshasathi.backend.Controller;

import com.surakshasathi.backend.Service.ReportService;
import com.surakshasathi.backend.dto.ReportResDTO;
import com.surakshasathi.backend.dto.StatusUpdateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AdminController {

    private final ReportService reportService;

    @GetMapping("/reports")
    public List<ReportResDTO> getAllReports() {
        return reportService.getAllReports();
    }
    @PatchMapping("/update-status/{token}")
    public Map<String, String> updateStatus(
            @PathVariable String token,
            @RequestBody StatusUpdateDTO dto
    ) {

        String message =
                reportService.updateReportStatus(token, dto);

        Map<String, String> response = new HashMap<>();

        response.put("message", message);

        return response;
    }

}
