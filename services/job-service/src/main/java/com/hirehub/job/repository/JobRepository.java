package com.hirehub.job.repository;

import com.hirehub.job.domain.Job;
import com.hirehub.job.domain.Job.JobStatus;
import com.hirehub.job.domain.Job.JobType;
import com.hirehub.job.domain.Job.ExperienceLevel;
import com.hirehub.job.domain.Job.RemoteType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {

    // Find by company
    Page<Job> findByCompanyId(UUID companyId, Pageable pageable);

    List<Job> findByCompanyIdAndStatus(UUID companyId, JobStatus status);

    // Find by status
    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    // Find active jobs
    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' AND (j.expiresAt IS NULL OR j.expiresAt > :now)")
    Page<Job> findActiveJobs(@Param("now") LocalDateTime now, Pageable pageable);

    // Search jobs with filters
    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' " +
           "AND (:jobType IS NULL OR j.jobType = :jobType) " +
           "AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel) " +
           "AND (:remoteType IS NULL OR j.remoteType = :remoteType) " +
           "AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
           "AND (:minSalary IS NULL OR j.salaryMax >= :minSalary) " +
           "AND (:maxSalary IS NULL OR j.salaryMin <= :maxSalary)")
    Page<Job> searchJobs(
            @Param("jobType") JobType jobType,
            @Param("experienceLevel") ExperienceLevel experienceLevel,
            @Param("remoteType") RemoteType remoteType,
            @Param("location") String location,
            @Param("minSalary") Integer minSalary,
            @Param("maxSalary") Integer maxSalary,
            Pageable pageable
    );

    // Full text search
    @Query(value = "SELECT * FROM jobs j WHERE j.status = 'ACTIVE' " +
                   "AND (to_tsvector('english', j.title) @@ plainto_tsquery('english', :query) " +
                   "OR to_tsvector('english', COALESCE(j.description, '')) @@ plainto_tsquery('english', :query))",
           nativeQuery = true)
    Page<Job> searchByKeyword(@Param("query") String query, Pageable pageable);

    // Find jobs by skill
    @Query("SELECT DISTINCT j FROM Job j JOIN j.jobSkills js WHERE js.skill.id = :skillId AND j.status = 'ACTIVE'")
    Page<Job> findBySkillId(@Param("skillId") UUID skillId, Pageable pageable);

    // Find jobs by multiple skills
    @Query("SELECT DISTINCT j FROM Job j JOIN j.jobSkills js WHERE js.skill.id IN :skillIds AND j.status = 'ACTIVE'")
    Page<Job> findBySkillIds(@Param("skillIds") List<UUID> skillIds, Pageable pageable);

    // Update view count
    @Modifying
    @Query("UPDATE Job j SET j.viewsCount = j.viewsCount + 1 WHERE j.id = :jobId")
    void incrementViewCount(@Param("jobId") UUID jobId);

    // Update apply count
    @Modifying
    @Query("UPDATE Job j SET j.appliesCount = j.appliesCount + 1 WHERE j.id = :jobId")
    void incrementApplyCount(@Param("jobId") UUID jobId);

    // Find expired jobs
    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' AND j.expiresAt IS NOT NULL AND j.expiresAt < :now")
    List<Job> findExpiredJobs(@Param("now") LocalDateTime now);

    // Update expired jobs status
    @Modifying
    @Query("UPDATE Job j SET j.status = 'EXPIRED' WHERE j.status = 'ACTIVE' AND j.expiresAt IS NOT NULL AND j.expiresAt < :now")
    int expireJobs(@Param("now") LocalDateTime now);

    // Count jobs by company
    long countByCompanyId(UUID companyId);

    long countByCompanyIdAndStatus(UUID companyId, JobStatus status);

    // Find with skills eagerly loaded
    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.jobSkills js LEFT JOIN FETCH js.skill WHERE j.id = :id")
    Optional<Job> findByIdWithSkills(@Param("id") UUID id);
}
