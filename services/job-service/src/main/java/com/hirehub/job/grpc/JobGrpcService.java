package com.hirehub.job.grpc;

import com.hirehub.job.domain.Job;
import com.hirehub.job.domain.Job.*;
import com.hirehub.job.domain.JobSkill;
import com.hirehub.job.domain.SkillTag;
import com.hirehub.job.service.JobService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * gRPC service implementation for Job Service.
 *
 * Note: This implementation uses placeholder types. Once proto files are compiled,
 * replace the placeholder types with generated proto message types:
 * - JobServiceGrpc.JobServiceImplBase
 * - CreateJobRequest, CreateJobResponse
 * - GetJobRequest, GetJobResponse
 * - etc.
 *
 * Expected proto definition (proto/job/v1/job.proto):
 *
 * service JobService {
 *   rpc CreateJob(CreateJobRequest) returns (CreateJobResponse);
 *   rpc GetJob(GetJobRequest) returns (GetJobResponse);
 *   rpc UpdateJob(UpdateJobRequest) returns (UpdateJobResponse);
 *   rpc DeleteJob(DeleteJobRequest) returns (DeleteJobResponse);
 *   rpc ListJobs(ListJobsRequest) returns (ListJobsResponse);
 *   rpc SearchJobs(SearchJobsRequest) returns (SearchJobsResponse);
 *   rpc PublishJob(PublishJobRequest) returns (PublishJobResponse);
 *   rpc CloseJob(CloseJobRequest) returns (CloseJobResponse);
 *   rpc IncrementApplyCount(IncrementApplyCountRequest) returns (IncrementApplyCountResponse);
 *   rpc ListSkillTags(ListSkillTagsRequest) returns (ListSkillTagsResponse);
 * }
 */
@GrpcService
@RequiredArgsConstructor
@Slf4j
public class JobGrpcService {
    // Uncomment and extend when proto is compiled:
    // extends JobServiceGrpc.JobServiceImplBase

    private final JobService jobService;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /*
     * Placeholder methods - replace with actual gRPC implementations once proto files are compiled.
     *
     * Example implementation pattern:
     *
     * @Override
     * public void createJob(CreateJobRequest request, StreamObserver<CreateJobResponse> responseObserver) {
     *     try {
     *         Job job = Job.builder()
     *                 .companyId(UUID.fromString(request.getCompanyId()))
     *                 .title(request.getTitle())
     *                 .description(request.getDescription())
     *                 .requirements(request.getRequirements())
     *                 .jobType(mapJobType(request.getJobType()))
     *                 .experienceLevel(mapExperienceLevel(request.getExperienceLevel()))
     *                 .experienceMin(request.getExperienceMin())
     *                 .experienceMax(request.getExperienceMax())
     *                 .salaryMin(request.getSalaryMin())
     *                 .salaryMax(request.getSalaryMax())
     *                 .location(request.getLocation())
     *                 .remoteType(mapRemoteType(request.getRemoteType()))
     *                 .build();
     *
     *         Job savedJob = jobService.createJob(
     *                 job,
     *                 request.getRequiredSkillsList(),
     *                 request.getPreferredSkillsList()
     *         );
     *
     *         CreateJobResponse response = CreateJobResponse.newBuilder()
     *                 .setJob(toProtoJob(savedJob))
     *                 .build();
     *
     *         responseObserver.onNext(response);
     *         responseObserver.onCompleted();
     *     } catch (Exception e) {
     *         log.error("Error creating job", e);
     *         responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
     *     }
     * }
     */

    // ========== Helper Methods ==========

    /**
     * Convert domain Job to proto Job message
     */
    protected Map<String, Object> toProtoJob(Job job) {
        Map<String, Object> protoJob = new HashMap<>();
        protoJob.put("id", job.getId().toString());
        protoJob.put("companyId", job.getCompanyId().toString());
        protoJob.put("title", job.getTitle());
        protoJob.put("description", job.getDescription());
        protoJob.put("requirements", job.getRequirements());
        protoJob.put("jobType", job.getJobType() != null ? job.getJobType().name() : null);
        protoJob.put("experienceLevel", job.getExperienceLevel() != null ? job.getExperienceLevel().name() : null);
        protoJob.put("experienceMin", job.getExperienceMin());
        protoJob.put("experienceMax", job.getExperienceMax());
        protoJob.put("salaryMin", job.getSalaryMin());
        protoJob.put("salaryMax", job.getSalaryMax());
        protoJob.put("location", job.getLocation());
        protoJob.put("remoteType", job.getRemoteType() != null ? job.getRemoteType().name() : null);
        protoJob.put("status", job.getStatus().name());
        protoJob.put("viewsCount", job.getViewsCount());
        protoJob.put("appliesCount", job.getAppliesCount());
        protoJob.put("postedAt", job.getPostedAt() != null ? job.getPostedAt().format(DATE_TIME_FORMATTER) : null);
        protoJob.put("expiresAt", job.getExpiresAt() != null ? job.getExpiresAt().format(DATE_TIME_FORMATTER) : null);
        protoJob.put("createdAt", job.getCreatedAt().format(DATE_TIME_FORMATTER));
        protoJob.put("updatedAt", job.getUpdatedAt().format(DATE_TIME_FORMATTER));

        // Add skills
        List<Map<String, Object>> skills = job.getJobSkills().stream()
                .map(this::toProtoJobSkill)
                .collect(Collectors.toList());
        protoJob.put("skills", skills);

        return protoJob;
    }

    /**
     * Convert domain JobSkill to proto JobSkill message
     */
    protected Map<String, Object> toProtoJobSkill(JobSkill jobSkill) {
        Map<String, Object> protoSkill = new HashMap<>();
        protoSkill.put("skillId", jobSkill.getSkill().getId().toString());
        protoSkill.put("skillName", jobSkill.getSkill().getName());
        protoSkill.put("category", jobSkill.getSkill().getCategory());
        protoSkill.put("isRequired", jobSkill.getIsRequired());
        return protoSkill;
    }

    /**
     * Convert domain SkillTag to proto SkillTag message
     */
    protected Map<String, Object> toProtoSkillTag(SkillTag skillTag) {
        Map<String, Object> protoSkillTag = new HashMap<>();
        protoSkillTag.put("id", skillTag.getId().toString());
        protoSkillTag.put("name", skillTag.getName());
        protoSkillTag.put("category", skillTag.getCategory());
        return protoSkillTag;
    }

    /**
     * Map proto JobType enum to domain JobType enum
     */
    protected JobType mapJobType(String protoJobType) {
        if (protoJobType == null || protoJobType.isEmpty()) {
            return null;
        }
        try {
            return JobType.valueOf(protoJobType);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown job type: {}", protoJobType);
            return null;
        }
    }

    /**
     * Map proto ExperienceLevel enum to domain ExperienceLevel enum
     */
    protected ExperienceLevel mapExperienceLevel(String protoExperienceLevel) {
        if (protoExperienceLevel == null || protoExperienceLevel.isEmpty()) {
            return null;
        }
        try {
            return ExperienceLevel.valueOf(protoExperienceLevel);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown experience level: {}", protoExperienceLevel);
            return null;
        }
    }

    /**
     * Map proto RemoteType enum to domain RemoteType enum
     */
    protected RemoteType mapRemoteType(String protoRemoteType) {
        if (protoRemoteType == null || protoRemoteType.isEmpty()) {
            return null;
        }
        try {
            return RemoteType.valueOf(protoRemoteType);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown remote type: {}", protoRemoteType);
            return null;
        }
    }

    /**
     * Parse datetime string to LocalDateTime
     */
    protected LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeStr, DATE_TIME_FORMATTER);
    }

    // ========== Service Methods (to be called from gRPC handlers) ==========

    public Job createJob(UUID companyId, String title, String description, String requirements,
                         String jobType, String experienceLevel, Integer experienceMin, Integer experienceMax,
                         Integer salaryMin, Integer salaryMax, String location, String remoteType,
                         String expiresAt, List<String> requiredSkills, List<String> preferredSkills) {

        Job job = Job.builder()
                .companyId(companyId)
                .title(title)
                .description(description)
                .requirements(requirements)
                .jobType(mapJobType(jobType))
                .experienceLevel(mapExperienceLevel(experienceLevel))
                .experienceMin(experienceMin)
                .experienceMax(experienceMax)
                .salaryMin(salaryMin)
                .salaryMax(salaryMax)
                .location(location)
                .remoteType(mapRemoteType(remoteType))
                .expiresAt(parseDateTime(expiresAt))
                .build();

        return jobService.createJob(job, requiredSkills, preferredSkills);
    }

    public Optional<Job> getJob(UUID jobId, boolean incrementView) {
        if (incrementView) {
            return jobService.getJobByIdAndIncrementView(jobId);
        }
        return jobService.getJobById(jobId);
    }

    public Job updateJob(UUID jobId, String title, String description, String requirements,
                         String jobType, String experienceLevel, Integer experienceMin, Integer experienceMax,
                         Integer salaryMin, Integer salaryMax, String location, String remoteType,
                         String expiresAt, List<String> requiredSkills, List<String> preferredSkills) {

        Job updatedJob = Job.builder()
                .title(title)
                .description(description)
                .requirements(requirements)
                .jobType(mapJobType(jobType))
                .experienceLevel(mapExperienceLevel(experienceLevel))
                .experienceMin(experienceMin)
                .experienceMax(experienceMax)
                .salaryMin(salaryMin)
                .salaryMax(salaryMax)
                .location(location)
                .remoteType(mapRemoteType(remoteType))
                .expiresAt(parseDateTime(expiresAt))
                .build();

        return jobService.updateJob(jobId, updatedJob, requiredSkills, preferredSkills);
    }

    public void deleteJob(UUID jobId) {
        jobService.deleteJob(jobId);
    }

    public Job publishJob(UUID jobId) {
        return jobService.publishJob(jobId);
    }

    public Job closeJob(UUID jobId) {
        return jobService.closeJob(jobId);
    }

    public Page<Job> listJobs(UUID companyId, int page, int size) {
        if (companyId != null) {
            return jobService.listJobsByCompany(companyId, page, size);
        }
        return jobService.listActiveJobs(page, size);
    }

    public Page<Job> searchJobs(String keyword, String jobType, String experienceLevel,
                                String remoteType, String location, Integer minSalary, Integer maxSalary,
                                int page, int size) {
        return jobService.searchJobs(
                keyword,
                mapJobType(jobType),
                mapExperienceLevel(experienceLevel),
                mapRemoteType(remoteType),
                location,
                minSalary,
                maxSalary,
                page,
                size
        );
    }

    public void incrementApplyCount(UUID jobId) {
        jobService.incrementApplyCount(jobId);
    }

    public List<SkillTag> listSkillTags(String category, String query) {
        if (query != null && !query.isEmpty()) {
            return jobService.searchSkillTags(query);
        }
        if (category != null && !category.isEmpty()) {
            return jobService.listSkillTagsByCategory(category);
        }
        return jobService.listAllSkillTags();
    }

    public List<SkillTag> getPopularSkills(int limit) {
        return jobService.getPopularSkills(limit);
    }
}
