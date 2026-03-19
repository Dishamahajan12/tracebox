package com.example.demo.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.project.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByProjectKeyIgnoreCase(String projectKey);

    boolean existsByProjectKeyIgnoreCase(String projectKey);

    List<Project> findAllByArchivedFalseOrderByCreatedAtDesc();
}
