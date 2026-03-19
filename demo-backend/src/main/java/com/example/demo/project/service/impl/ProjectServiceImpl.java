package com.example.demo.project.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.authorization.service.ProjectAuthorizationService;
import com.example.demo.common.exception.ConflictException;
import com.example.demo.common.security.SecurityUtils;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.project.dto.CreateProjectRequest;
import com.example.demo.project.dto.ProjectResponse;
import com.example.demo.project.dto.ProjectSummaryDto;
import com.example.demo.project.dto.UpdateProjectRequest;
import com.example.demo.project.entity.Project;
import com.example.demo.project.exception.ProjectNotFoundException;
import com.example.demo.project.repository.ProjectRepository;
import com.example.demo.project.service.ProjectService;
import com.example.demo.projectmember.entity.ProjectMember;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.projectmember.repository.ProjectMemberRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.service.UserService;

@Service
@Transactional
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserService userService;
    private final ProjectAuthorizationService projectAuthorizationService;

    public ProjectServiceImpl(
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            UserService userService,
            ProjectAuthorizationService projectAuthorizationService) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userService = userService;
        this.projectAuthorizationService = projectAuthorizationService;
    }

    @Override
    public ProjectResponse createProject(CreateProjectRequest request) {
        String normalizedKey = request.projectKey().trim().toUpperCase();
        if (projectRepository.existsByProjectKeyIgnoreCase(normalizedKey)) {
            throw new ConflictException("Project key already exists: " + normalizedKey);
        }

        User currentUser = userService.getRequiredUser(SecurityUtils.getCurrentUserId());
        Project project = new Project(
                request.name().trim(),
                normalizedKey,
                request.description() == null ? null : request.description().trim(),
                currentUser);

        Project savedProject = projectRepository.save(project);
        projectMemberRepository.save(new ProjectMember(savedProject, currentUser, ProjectRole.PROJECT_OWNER));
        return DtoMapper.toProjectResponse(savedProject, ProjectRole.PROJECT_OWNER);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long projectId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        ProjectMember membership = projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.VIEWER);
        Project project = getRequiredProject(projectId);
        return DtoMapper.toProjectResponse(project, membership.getProjectRole());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectSummaryDto> getMyProjects() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return projectMemberRepository.findAllByUserIdOrderByCreatedAtDesc(currentUserId).stream()
                .map(member -> DtoMapper.toProjectSummary(member.getProject(), member.getProjectRole()))
                .toList();
    }

    @Override
    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        ProjectMember membership = projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.PROJECT_ADMIN);
        Project project = getRequiredProject(projectId);
        project.setName(request.name().trim());
        project.setDescription(request.description() == null ? null : request.description().trim());
        if (request.archived() != null) {
            project.setArchived(request.archived());
        }
        return DtoMapper.toProjectResponse(projectRepository.save(project), membership.getProjectRole());
    }

    @Override
    @Transactional(readOnly = true)
    public Project getRequiredProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }
}
