package com.example.demo.projectmember.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.projectmember.entity.ProjectMember;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    List<ProjectMember> findAllByProjectIdOrderByCreatedAtAsc(Long projectId);

    List<ProjectMember> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
            select pm
            from ProjectMember pm
            join fetch pm.user
            where pm.project.id = :projectId
              and (:search is null
                or lower(pm.user.fullName) like lower(concat('%', :search, '%'))
                or lower(pm.user.email) like lower(concat('%', :search, '%')))
            order by pm.user.fullName asc
            """)
    List<ProjectMember> searchProjectMembers(@Param("projectId") Long projectId, @Param("search") String search);

    @Query("select pm.project.id from ProjectMember pm where pm.user.id = :userId")
    List<Long> findProjectIdsByUserId(@Param("userId") Long userId);
}
