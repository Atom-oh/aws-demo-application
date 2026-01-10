package com.hirehub.job.service;

import com.hirehub.job.domain.Job;
import com.hirehub.job.domain.Job.*;
import com.hirehub.job.domain.SkillTag;
import com.hirehub.job.repository.JobRepository;
import com.hirehub.job.repository.SkillTagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private SkillTagRepository skillTagRepository;

    @InjectMocks
    private JobService jobService;

    private Job testJob;
    private UUID jobId;
    private UUID companyId;

    @BeforeEach
    void setUp() {
        jobId = UUID.randomUUID();
        companyId = UUID.randomUUID();

        testJob = Job.builder()
                .id(jobId)
                .companyId(companyId)
                .title("Software Engineer")
                .description("Build amazing software")
                .requirements("5+ years experience")
                .jobType(JobType.FULL_TIME)
                .experienceLevel(ExperienceLevel.MID)
                .status(JobStatus.DRAFT)
                .location("Seoul")
                .remoteType(RemoteType.HYBRID)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("createJob tests")
    class CreateJobTests {

        @Test
        @DisplayName("Should create job with skills")
        void shouldCreateJobWithSkills() {
            // Given
            List<String> requiredSkills = Arrays.asList("Java", "Spring");
            List<String> preferredSkills = Arrays.asList("Kubernetes");

            SkillTag javaSkill = SkillTag.builder().id(UUID.randomUUID()).name("Java").build();
            SkillTag springSkill = SkillTag.builder().id(UUID.randomUUID()).name("Spring").build();
            SkillTag k8sSkill = SkillTag.builder().id(UUID.randomUUID()).name("Kubernetes").build();

            given(jobRepository.save(any(Job.class))).willReturn(testJob);
            given(skillTagRepository.findByNameIgnoreCase("Java")).willReturn(Optional.of(javaSkill));
            given(skillTagRepository.findByNameIgnoreCase("Spring")).willReturn(Optional.of(springSkill));
            given(skillTagRepository.findByNameIgnoreCase("Kubernetes")).willReturn(Optional.of(k8sSkill));

            // When
            Job result = jobService.createJob(testJob, requiredSkills, preferredSkills);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(jobId);
            verify(jobRepository, times(2)).save(any(Job.class));
        }

        @Test
        @DisplayName("Should create job without skills")
        void shouldCreateJobWithoutSkills() {
            // Given
            given(jobRepository.save(any(Job.class))).willReturn(testJob);

            // When
            Job result = jobService.createJob(testJob, null, null);

            // Then
            assertThat(result).isNotNull();
            verify(jobRepository, times(2)).save(any(Job.class));
            verify(skillTagRepository, never()).findByNameIgnoreCase(anyString());
        }
    }

    @Nested
    @DisplayName("getJobById tests")
    class GetJobByIdTests {

        @Test
        @DisplayName("Should return job when exists")
        void shouldReturnJobWhenExists() {
            // Given
            given(jobRepository.findByIdWithSkills(jobId)).willReturn(Optional.of(testJob));

            // When
            Optional<Job> result = jobService.getJobById(jobId);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getId()).isEqualTo(jobId);
        }

        @Test
        @DisplayName("Should return empty when job not exists")
        void shouldReturnEmptyWhenJobNotExists() {
            // Given
            given(jobRepository.findByIdWithSkills(any(UUID.class))).willReturn(Optional.empty());

            // When
            Optional<Job> result = jobService.getJobById(UUID.randomUUID());

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("updateJob tests")
    class UpdateJobTests {

        @Test
        @DisplayName("Should update job successfully")
        void shouldUpdateJobSuccessfully() {
            // Given
            Job updatedJob = Job.builder()
                    .title("Senior Software Engineer")
                    .description("Lead engineering team")
                    .jobType(JobType.FULL_TIME)
                    .experienceLevel(ExperienceLevel.SENIOR)
                    .build();

            given(jobRepository.findById(jobId)).willReturn(Optional.of(testJob));
            given(jobRepository.save(any(Job.class))).willReturn(testJob);

            // When
            Job result = jobService.updateJob(jobId, updatedJob, null, null);

            // Then
            assertThat(result).isNotNull();
            verify(jobRepository).findById(jobId);
            verify(jobRepository).save(any(Job.class));
        }

        @Test
        @DisplayName("Should throw when job not found")
        void shouldThrowWhenJobNotFound() {
            // Given
            UUID nonExistentId = UUID.randomUUID();
            given(jobRepository.findById(nonExistentId)).willReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> jobService.updateJob(nonExistentId, testJob, null, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Job not found");
        }
    }

    @Nested
    @DisplayName("publishJob tests")
    class PublishJobTests {

        @Test
        @DisplayName("Should publish draft job")
        void shouldPublishDraftJob() {
            // Given
            testJob.setStatus(JobStatus.DRAFT);
            given(jobRepository.findById(jobId)).willReturn(Optional.of(testJob));
            given(jobRepository.save(any(Job.class))).willReturn(testJob);

            // When
            Job result = jobService.publishJob(jobId);

            // Then
            assertThat(result).isNotNull();
            verify(jobRepository).findById(jobId);
            verify(jobRepository).save(any(Job.class));
        }

        @Test
        @DisplayName("Should throw when job not found for publish")
        void shouldThrowWhenJobNotFoundForPublish() {
            // Given
            UUID nonExistentId = UUID.randomUUID();
            given(jobRepository.findById(nonExistentId)).willReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> jobService.publishJob(nonExistentId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Job not found");
        }
    }

    @Nested
    @DisplayName("listJobsByCompany tests")
    class ListJobsByCompanyTests {

        @Test
        @DisplayName("Should return paged jobs for company")
        void shouldReturnPagedJobsForCompany() {
            // Given
            Page<Job> expectedPage = new PageImpl<>(Arrays.asList(testJob));
            given(jobRepository.findByCompanyId(eq(companyId), any(Pageable.class)))
                    .willReturn(expectedPage);

            // When
            Page<Job> result = jobService.listJobsByCompany(companyId, 0, 10);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getCompanyId()).isEqualTo(companyId);
        }
    }

    @Nested
    @DisplayName("searchJobs tests")
    class SearchJobsTests {

        @Test
        @DisplayName("Should search by keyword")
        void shouldSearchByKeyword() {
            // Given
            Page<Job> expectedPage = new PageImpl<>(Arrays.asList(testJob));
            given(jobRepository.searchByKeyword(eq("engineer"), any(Pageable.class)))
                    .willReturn(expectedPage);

            // When
            Page<Job> result = jobService.searchJobs(
                    "engineer", null, null, null, null, null, null, 0, 10
            );

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(jobRepository).searchByKeyword(eq("engineer"), any(Pageable.class));
        }

        @Test
        @DisplayName("Should search with filters when no keyword")
        void shouldSearchWithFiltersWhenNoKeyword() {
            // Given
            Page<Job> expectedPage = new PageImpl<>(Arrays.asList(testJob));
            given(jobRepository.searchJobs(
                    any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                    .willReturn(expectedPage);

            // When
            Page<Job> result = jobService.searchJobs(
                    null, JobType.FULL_TIME, ExperienceLevel.MID, RemoteType.HYBRID,
                    "Seoul", 50000, 100000, 0, 10
            );

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(jobRepository).searchJobs(
                    eq(JobType.FULL_TIME), eq(ExperienceLevel.MID), eq(RemoteType.HYBRID),
                    eq("Seoul"), eq(50000), eq(100000), any(Pageable.class)
            );
        }
    }

    @Nested
    @DisplayName("SkillTag tests")
    class SkillTagTests {

        @Test
        @DisplayName("Should return existing skill tag")
        void shouldReturnExistingSkillTag() {
            // Given
            SkillTag existingSkill = SkillTag.builder()
                    .id(UUID.randomUUID())
                    .name("Java")
                    .category("Programming")
                    .build();
            given(skillTagRepository.findByNameIgnoreCase("Java"))
                    .willReturn(Optional.of(existingSkill));

            // When
            SkillTag result = jobService.getOrCreateSkillTag("Java", "Programming");

            // Then
            assertThat(result).isEqualTo(existingSkill);
            verify(skillTagRepository, never()).save(any(SkillTag.class));
        }

        @Test
        @DisplayName("Should create new skill tag when not exists")
        void shouldCreateNewSkillTagWhenNotExists() {
            // Given
            SkillTag newSkill = SkillTag.builder()
                    .id(UUID.randomUUID())
                    .name("Rust")
                    .category("Programming")
                    .build();
            given(skillTagRepository.findByNameIgnoreCase("Rust"))
                    .willReturn(Optional.empty());
            given(skillTagRepository.save(any(SkillTag.class)))
                    .willReturn(newSkill);

            // When
            SkillTag result = jobService.getOrCreateSkillTag("Rust", "Programming");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Rust");
            verify(skillTagRepository).save(any(SkillTag.class));
        }
    }
}
