package com.hirehub.job.repository;

import com.hirehub.job.domain.SkillTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillTagRepository extends JpaRepository<SkillTag, UUID> {

    Optional<SkillTag> findByName(String name);

    Optional<SkillTag> findByNameIgnoreCase(String name);

    List<SkillTag> findByCategory(String category);

    List<SkillTag> findByNameContainingIgnoreCase(String name);

    @Query("SELECT st FROM SkillTag st WHERE LOWER(st.name) IN :names")
    List<SkillTag> findByNamesIgnoreCase(@Param("names") List<String> names);

    @Query("SELECT DISTINCT st.category FROM SkillTag st WHERE st.category IS NOT NULL")
    List<String> findAllCategories();

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT st FROM SkillTag st WHERE st.id IN :ids")
    List<SkillTag> findByIds(@Param("ids") List<UUID> ids);

    // Find popular skills (used in most jobs)
    @Query(value = "SELECT st.* FROM skill_tags st " +
                   "JOIN job_skills js ON st.id = js.skill_id " +
                   "GROUP BY st.id ORDER BY COUNT(js.job_id) DESC LIMIT :limit",
           nativeQuery = true)
    List<SkillTag> findPopularSkills(@Param("limit") int limit);
}
