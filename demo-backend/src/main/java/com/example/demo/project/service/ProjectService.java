package com.example.demo.project.service;

import java.util.List;

import com.example.demo.project.dto.CreateProjectRequest;
import com.example.demo.project.dto.ProjectResponse;
import com.example.demo.project.dto.ProjectSummaryDto;
import com.example.demo.project.dto.UpdateProjectRequest;
import com.example.demo.project.entity.Project;

public interface ProjectService {

    ProjectResponse createProject(CreateProjectRequest request);

    ProjectResponse getProject(Long projectId);

    List<ProjectSummaryDto> getMyProjects();

    ProjectResponse updateProject(Long projectId, UpdateProjectRequest request);

    Project getRequiredProject(Long projectId);
}
