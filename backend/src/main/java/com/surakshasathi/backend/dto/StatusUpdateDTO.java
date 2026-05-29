package com.surakshasathi.backend.dto;

import com.surakshasathi.backend.enums.ReportStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatusUpdateDTO {
    @Enumerated(EnumType.STRING)
    private ReportStatus reportStatus;
}
