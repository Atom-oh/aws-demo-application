package com.hirehub.job.service;

import com.hirehub.job.domain.Job;
import com.hirehub.job.domain.Job.*;
import com.hirehub.job.domain.JobSkill;
import com.hirehub.job.domain.SkillTag;
import com.hirehub.job.repository.JobRepository;
import com.hirehub.job.repository.SkillTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class JobService {

    private final JobRepository jobRepository;
    private final SkillTagRepository skillTagRepository;

    /**
     * Create a new job posting
     */
    @Transactional
    public Job createJob(Job job, List<String> requiredSkills, List<String> preferredSkills) {
        log.info("Creating new job: {} for company: {}", job.getTitle(), job.getCompanyId());

        // Save job first
        Job savedJob = jobRepository.save(job);

        // Add skills
        addSkillsToJob(savedJob, requiredSkills, true);
        addSkillsToJob(savedJob, preferredSkills, false);

        return jobRepository.save(savedJob);
    }

    /**
     * Get job by ID
     */
    public Optional<Job> getJobById(UUID jobId) {
        return jobRepository.findByIdWithSkills(jobId);
    }

    /**
     * Get job by ID and increment view count
     */
    @Transactional
    public Optional<Job> getJobByIdAndIncrementView(UUID jobId) {
        Optional<Job> job = jobRepository.findByIdWithSkills(jobId);
        job.ifPresent(j -> jobRepository.incrementViewCount(jobId));
        return job;
    }

    /**
     * Update an existing job
     */
    @Transactional
    public Job updateJob(UUID jobId, Job updatedJob, List<String> requiredSkills, List<String> preferredSkills) {
        log.info("Updating job: {}", jobId);

        Job existingJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Update fields
        existingJob.setTitle(updatedJob.getTitle());
        existingJob.setDescription(updatedJob.getDescription());
        existingJob.setRequirements(updatedJob.getRequirements());
        existingJob.setJobType(updatedJob.getJobType());
        existingJob.setExperienceLevel(updatedJob.getExperienceLevel());
        existingJob.setExperienceMin(updatedJob.getExperienceMin());
        existingJob.setExperienceMax(updatedJob.getExperienceMax());
        existingJob.setSalaryMin(updatedJob.getSalaryMin());
        existingJob.setSalaryMax(updatedJob.getSalaryMax());
        existingJob.setLocation(updatedJob.getLocation());
        existingJob.setRemoteType(updatedJob.getRemoteType());
        existingJob.setExpiresAt(updatedJob.getExpiresAt());

        // Update skills - clear existing and add new
        existingJob.getJobSkills().clear();
        addSkillsToJob(existingJob, requiredSkills, true);
        addSkillsToJob(existingJob, preferredSkills, false);

        return jobRepository.save(existingJob);
    }

    /**
     * Delete a job
     */
    @Transactional
    public void deleteJob(UUID jobId) {
        log.info("Deleting job: {}", jobId);
        jobRepository.deleteById(jobId);
    }

    /**
     * Publish a job (change status to ACTIVE)
     */
    @Transactional
    public Job publishJob(UUID jobId) {
        log.info("Publishing job: {}", jobId);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.publish();
        return jobRepository.save(job);
    }

    /**
     * Close a job
     */
    @Transactional
    public Job closeJob(UUID jobId) {
        log.info("Closing job: {}", jobId);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.setStatus(JobStatus.CLOSED);
        return jobRepository.save(job);
    }

    /**
     * List jobs by company
     */
    public Page<Job> listJobsByCompany(UUID companyId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return jobRepository.findByCompanyId(companyId, pageable);
    }

    /**
     * List active jobs
     */
    public Page<Job> listActiveJobs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("postedAt").descending());
        return jobRepository.findActiveJobs(LocalDateTime.now(), pageable);
    }

    /**
     * Search jobs with filters
     */
    public Page<Job> searchJobs(
            String keyword,
            JobType jobType,
            ExperienceLevel experienceLevel,
            RemoteType remoteType,
            String location,
            Integer minSalary,
            Integer maxSalary,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("postedAt").descending());

        if (keyword != null && !keyword.isBlank()) {
            return jobRepository.searchByKeyword(keyword, pageable);
        }

        return jobRepository.searchJobs(
                jobType, experienceLevel, remoteType,
                location, minSalary, maxSalary, pageable
        );
    }

    /**
     * Search jobs by skills
     */
    public Page<Job> searchJobsBySkills(List<UUID> skillIds, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("postedAt").descending());
        return jobRepository.findBySkillIds(skillIds, pageable);
    }

    /**
     * Increment apply count for a job
     */
    @Transactional
    public void incrementApplyCount(UUID jobId) {
        jobRepository.incrementApplyCount(jobId);
    }

    /**
     * Expire old jobs (scheduled task)
     */
    @Transactional
    public int expireOldJobs() {
        int count = jobRepository.expireJobs(LocalDateTime.now());
        log.info("Expired {} jobs", count);
        return count;
    }

    /**
     * Get or create skill tag
     */
    @Transactional
    public SkillTag getOrCreateSkillTag(String skillName, String category) {
        return skillTagRepository.findByNameIgnoreCase(skillName)
                .orElseGet(() -> {
                    SkillTag newSkill = SkillTag.builder()
                            .name(skillName)
                            .category(category)
                            .build();
                    return skillTagRepository.save(newSkill);
                });
    }

    /**
     * List all skill tags
     */
    public List<SkillTag> listAllSkillTags() {
        return skillTagRepository.findAll();
    }

    /**
     * List skill tags by category
     */
    public List<SkillTag> listSkillTagsByCategory(String category) {
        return skillTagRepository.findByCategory(category);
    }

    /**
     * Search skill tags
     */
    public List<SkillTag> searchSkillTags(String query) {
        return skillTagRepository.findByNameContainingIgnoreCase(query);
    }

    /**
     * Get popular skills
     */
    public List<SkillTag> getPopularSkills(int limit) {
        return skillTagRepository.findPopularSkills(limit);
    }

    // Helper method to add skills to a job
    private void addSkillsToJob(Job job, List<String> skillNames, boolean isRequired) {
        if (skillNames == null || skillNames.isEmpty()) {
            return;
        }

        for (String skillName : skillNames) {
            SkillTag skill = getOrCreateSkillTag(skillName, null);
            JobSkill jobSkill = JobSkill.builder()
                    .id(new JobSkill.JobSkillId(job.getId(), skill.getId()))
                    .job(job)
                    .skill(skill)
                    .isRequired(isRequired)
                    .build();
            job.getJobSkills().add(jobSkill);
        }
    }
}
