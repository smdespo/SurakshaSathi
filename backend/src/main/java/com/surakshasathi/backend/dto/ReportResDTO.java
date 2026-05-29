package com.surakshasathi.backend.dto;


import com.surakshasathi.backend.enums.ReportStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportResDTO {
    private String title;

    private String description;

    private String trackingToken;

    private String incidentType;

    private Double latitude;

    private Double longitude;

    private String severity;

    private ReportStatus status;

    private LocalDateTime createdAt;
}
