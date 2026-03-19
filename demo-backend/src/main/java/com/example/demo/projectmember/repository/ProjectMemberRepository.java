package com.example.demo.projectmember.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.projectmember.entity.ProjectMember;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    List<ProjectMember> findAllByProjectIdOrderByCreatedAtAsc(Long projectId);

    List<ProjectMember> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
