package com.example.demo.project.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.project.dto.CreateProjectRequest;
import com.example.demo.project.dto.ProjectResponse;
import com.example.demo.project.dto.ProjectSummaryDto;
import com.example.demo.project.dto.UpdateProjectRequest;
import com.example.demo.project.service.ProjectService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", projectService.createProject(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectSummaryDto>>> getMyProjects() {
        return ResponseEntity.ok(ApiResponse.success("Projects fetched successfully", projectService.getMyProjects()));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success("Project fetched successfully", projectService.getProject(projectId)));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", projectService.updateProject(projectId, request)));
    }
}
