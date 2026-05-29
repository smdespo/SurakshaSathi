package com.surakshasathi.backend.entity;


import com.surakshasathi.backend.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;


import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String title;
    private String description;
    @Column(unique = true)
    private String trackingToken;
    private String incidentType;
    private Double latitude;
    private Double longitude;
    private  String severity;
    private ReportStatus status;
    private LocalDateTime createdAt;
    private Integer trustScore;
    private String ipHash;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "report", fetch = FetchType.LAZY)
    private List<Evidence> evidenceList;

}
