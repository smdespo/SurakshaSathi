package com.surakshasathi.backend.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.time.LocalDateTime;
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
    private String status;
    private LocalDateTime createdAt;
}
