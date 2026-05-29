package com.surakshasathi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportReqDTO {
    private String title;
    private String description;
    private String incidentType;
    private Double latitude;
    private Double longitude;
    private String severity;

}
