package com.example.demo.report.service.impl;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.authorization.service.ProjectAuthorizationService;
import com.example.demo.common.exception.BadRequestException;
import com.example.demo.common.model.CreatedAtSort;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.project.entity.Project;
import com.example.demo.project.service.ProjectService;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.projectmember.repository.ProjectMemberRepository;
import com.example.demo.report.dto.CreateProjectReportRequest;
import com.example.demo.report.dto.ProjectReportResponse;
import com.example.demo.report.entity.ProjectReport;
import com.example.demo.report.repository.ProjectReportRepository;
import com.example.demo.report.service.ProjectReportService;
import com.example.demo.user.entity.User;
import com.example.demo.user.service.UserService;

@Service
@Transactional
public class ProjectReportServiceImpl implements ProjectReportService {

    private final ProjectReportRepository projectReportRepository;
    private final ProjectService projectService;
    private final UserService userService;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectAuthorizationService projectAuthorizationService;

    public ProjectReportServiceImpl(
            ProjectReportRepository projectReportRepository,
            ProjectService projectService,
            UserService userService,
            ProjectMemberRepository projectMemberRepository,
            ProjectAuthorizationService projectAuthorizationService) {
        this.projectReportRepository = projectReportRepository;
        this.projectService = projectService;
        this.userService = userService;
        this.projectMemberRepository = projectMemberRepository;
        this.projectAuthorizationService = projectAuthorizationService;
    }

    @Override
    public ProjectReportResponse createProjectReport(Long projectId, CreateProjectReportRequest request) {
        Long currentUserId = com.example.demo.common.security.SecurityUtils.getCurrentUserId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);

        Project project = projectService.getRequiredProject(projectId);
        User creator = userService.getRequiredUser(currentUserId);

        ProjectReport report = new ProjectReport();
        report.setProject(project);
        report.setCreatedBy(creator);
        applyReportValues(report, projectId, request);

        return DtoMapper.toProjectReportResponse(projectReportRepository.save(report));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectReportResponse> getProjectReports(Long projectId, String search, String sort) {
        Long currentUserId = com.example.demo.common.security.SecurityUtils.getCurrentUserId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.VIEWER);

        Specification<ProjectReport> specification = Specification.where(projectIdEquals(projectId))
                .and(searchMatches(normalizeNullableText(search)));

        return projectReportRepository.findAll(specification, CreatedAtSort.from(sort).toSort()).stream()
                .map(DtoMapper::toProjectReportResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectReportResponse getProjectReport(Long reportId) {
        Long currentUserId = com.example.demo.common.security.SecurityUtils.getCurrentUserId();
        ProjectReport report = getRequiredReport(reportId);
        projectAuthorizationService.requireProjectRole(report.getProject().getId(), currentUserId, ProjectRole.VIEWER);
        return DtoMapper.toProjectReportResponse(report);
    }

    @Override
    public ProjectReportResponse updateProjectReport(Long reportId, CreateProjectReportRequest request) {
        Long currentUserId = com.example.demo.common.security.SecurityUtils.getCurrentUserId();
        ProjectReport report = getRequiredReport(reportId);
        Long projectId = report.getProject().getId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);

        applyReportValues(report, projectId, request);
        return DtoMapper.toProjectReportResponse(projectReportRepository.save(report));
    }

    private ProjectReport getRequiredReport(Long reportId) {
        return projectReportRepository.findById(reportId)
                .orElseThrow(() -> new com.example.demo.common.exception.ResourceNotFoundException(
                        "Report not found with id: " + reportId));
    }

    private User resolveAssignee(Long projectId, Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId)) {
            throw new BadRequestException("Assignee must be a project member");
        }
        return userService.getRequiredUser(assigneeId);
    }

    private void applyReportValues(ProjectReport report, Long projectId, CreateProjectReportRequest request) {
        report.setName(request.name().trim());
        report.setDescription(normalizeNullableText(request.description()));
        report.setSearchText(normalizeNullableText(request.searchText()));
        report.setStatus(request.status());
        report.setSortOrder(request.sortOrder() == null ? CreatedAtSort.NEWEST : request.sortOrder());
        report.setAssignee(resolveAssignee(projectId, request.assigneeId()));
    }

    private Specification<ProjectReport> projectIdEquals(Long projectId) {
        return (root, query, builder) -> builder.equal(root.get("project").get("id"), projectId);
    }

    private Specification<ProjectReport> searchMatches(String search) {
        if (search == null) {
            return null;
        }
        return (root, query, builder) -> builder.or(
                builder.like(builder.lower(root.get("name")), "%" + search.toLowerCase() + "%"),
                builder.like(builder.lower(root.get("description")), "%" + search.toLowerCase() + "%"),
                builder.like(builder.lower(root.get("searchText")), "%" + search.toLowerCase() + "%"));
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
