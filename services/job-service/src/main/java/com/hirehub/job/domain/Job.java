package com.hirehub.job.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "job_type", length = 50)
    @Enumerated(EnumType.STRING)
    private JobType jobType;

    @Column(name = "experience_level", length = 50)
    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;

    @Column(name = "experience_min")
    private Integer experienceMin;

    @Column(name = "experience_max")
    private Integer experienceMax;

    @Column(name = "salary_min")
    private Integer salaryMin;

    @Column(name = "salary_max")
    private Integer salaryMax;

    @Column(length = 200)
    private String location;

    @Column(name = "remote_type", length = 50)
    @Enumerated(EnumType.STRING)
    private RemoteType remoteType;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private JobStatus status = JobStatus.DRAFT;

    @Column(name = "views_count")
    @Builder.Default
    private Integer viewsCount = 0;

    @Column(name = "applies_count")
    @Builder.Default
    private Integer appliesCount = 0;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<JobSkill> jobSkills = new HashSet<>();

    // Enums
    public enum JobType {
        FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE
    }

    public enum ExperienceLevel {
        ENTRY, JUNIOR, MID, SENIOR, LEAD, EXECUTIVE
    }

    public enum RemoteType {
        ONSITE, REMOTE, HYBRID
    }

    public enum JobStatus {
        DRAFT, ACTIVE, PAUSED, CLOSED, EXPIRED
    }

    // Helper methods
    public void addSkill(SkillTag skill, boolean isRequired) {
        JobSkill jobSkill = new JobSkill(this, skill, isRequired);
        jobSkills.add(jobSkill);
    }

    public void removeSkill(SkillTag skill) {
        jobSkills.removeIf(js -> js.getSkill().equals(skill));
    }

    public void publish() {
        this.status = JobStatus.ACTIVE;
        this.postedAt = LocalDateTime.now();
    }

    public void incrementViewCount() {
        this.viewsCount++;
    }

    public void incrementApplyCount() {
        this.appliesCount++;
    }
}
