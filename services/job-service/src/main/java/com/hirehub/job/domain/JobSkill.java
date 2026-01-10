package com.hirehub.job.domain;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "job_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSkill {

    @EmbeddedId
    private JobSkillId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("jobId")
    @JoinColumn(name = "job_id")
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("skillId")
    @JoinColumn(name = "skill_id")
    private SkillTag skill;

    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = true;

    public JobSkill(Job job, SkillTag skill, Boolean isRequired) {
        this.id = new JobSkillId(job.getId(), skill.getId());
        this.job = job;
        this.skill = skill;
        this.isRequired = isRequired;
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class JobSkillId implements Serializable {

        @Column(name = "job_id")
        private UUID jobId;

        @Column(name = "skill_id")
        private UUID skillId;
    }
}
