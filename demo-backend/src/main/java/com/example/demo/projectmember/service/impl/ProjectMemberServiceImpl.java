package com.example.demo.projectmember.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.authorization.exception.AccessDeniedException;
import com.example.demo.authorization.service.ProjectAuthorizationService;
import com.example.demo.common.security.SecurityUtils;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.project.entity.Project;
import com.example.demo.project.service.ProjectService;
import com.example.demo.projectmember.dto.AddProjectMemberRequest;
import com.example.demo.projectmember.dto.ProjectMemberResponse;
import com.example.demo.projectmember.dto.UpdateProjectMemberRoleRequest;
import com.example.demo.projectmember.entity.ProjectMember;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.projectmember.entity.ProjectTeamRole;
import com.example.demo.projectmember.exception.DuplicateProjectMemberException;
import com.example.demo.projectmember.exception.ProjectMemberNotFoundException;
import com.example.demo.projectmember.repository.ProjectMemberRepository;
import com.example.demo.projectmember.service.ProjectMemberService;
import com.example.demo.user.entity.User;
import com.example.demo.user.service.UserService;

@Service
@Transactional
public class ProjectMemberServiceImpl implements ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectService projectService;
    private final UserService userService;
    private final ProjectAuthorizationService projectAuthorizationService;

    public ProjectMemberServiceImpl(
            ProjectMemberRepository projectMemberRepository,
            ProjectService projectService,
            UserService userService,
            ProjectAuthorizationService projectAuthorizationService) {
        this.projectMemberRepository = projectMemberRepository;
        this.projectService = projectService;
        this.userService = userService;
        this.projectAuthorizationService = projectAuthorizationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(Long projectId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.VIEWER);
        return projectMemberRepository.findAllByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .map(DtoMapper::toProjectMemberResponse)
                .toList();
    }

    @Override
    public ProjectMemberResponse addProjectMember(Long projectId, AddProjectMemberRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        ProjectMember actorMembership = projectAuthorizationService
                .requireProjectRole(projectId, currentUserId, ProjectRole.PROJECT_ADMIN);
        ProjectRole accessRole = request.accessRole() == null ? ProjectRole.MEMBER : request.accessRole();

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, request.userId())) {
            throw new DuplicateProjectMemberException(projectId, request.userId());
        }

        if (accessRole == ProjectRole.PROJECT_OWNER && actorMembership.getProjectRole() != ProjectRole.PROJECT_OWNER) {
            throw new AccessDeniedException("Only the project owner can assign the owner role");
        }

        Project project = projectService.getRequiredProject(projectId);
        User user = userService.getRequiredUser(request.userId());
        ProjectTeamRole teamRole = request.projectRole() == null
                ? ProjectTeamRole.defaultForAccessRole(accessRole)
                : request.projectRole();
        ProjectMember savedMember = projectMemberRepository.save(new ProjectMember(project, user, accessRole, teamRole));
        return DtoMapper.toProjectMemberResponse(savedMember);
    }

    @Override
    public ProjectMemberResponse updateProjectMemberRole(
            Long projectId,
            Long userId,
            UpdateProjectMemberRoleRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        ProjectMember actorMembership = projectAuthorizationService
                .requireProjectRole(projectId, currentUserId, ProjectRole.PROJECT_ADMIN);
        ProjectMember targetMembership = getRequiredMembership(projectId, userId);
        ProjectRole newAccessRole = request.accessRole() == null ? targetMembership.getProjectRole() : request.accessRole();

        validateMembershipManagement(actorMembership.getProjectRole(), targetMembership.getProjectRole(), newAccessRole);

        targetMembership.setProjectRole(newAccessRole);
        targetMembership.setTeamRole(request.projectRole() == null
                ? ProjectTeamRole.defaultForAccessRole(newAccessRole)
                : request.projectRole());
        return DtoMapper.toProjectMemberResponse(projectMemberRepository.save(targetMembership));
    }

    @Override
    public void removeProjectMember(Long projectId, Long userId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        ProjectMember actorMembership = projectAuthorizationService
                .requireProjectRole(projectId, currentUserId, ProjectRole.PROJECT_ADMIN);
        ProjectMember targetMembership = getRequiredMembership(projectId, userId);

        validateMembershipRemoval(actorMembership.getProjectRole(), targetMembership.getProjectRole(), userId, currentUserId);

        projectMemberRepository.delete(targetMembership);
    }

    private ProjectMember getRequiredMembership(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ProjectMemberNotFoundException(projectId, userId));
    }

    private void validateMembershipManagement(ProjectRole actorRole, ProjectRole targetRole, ProjectRole newRole) {
        if (targetRole == ProjectRole.PROJECT_OWNER) {
            throw new AccessDeniedException("Project owner role cannot be modified from this endpoint");
        }
        if (newRole == ProjectRole.PROJECT_OWNER && actorRole != ProjectRole.PROJECT_OWNER) {
            throw new AccessDeniedException("Only the project owner can assign the owner role");
        }
        if (actorRole == ProjectRole.PROJECT_ADMIN
                && (targetRole == ProjectRole.PROJECT_ADMIN || newRole == ProjectRole.PROJECT_ADMIN)) {
            throw new AccessDeniedException("Project admins can manage members and viewers only");
        }
    }

    private void validateMembershipRemoval(ProjectRole actorRole, ProjectRole targetRole, Long targetUserId, Long actorUserId) {
        if (targetRole == ProjectRole.PROJECT_OWNER) {
            throw new AccessDeniedException("Project owner cannot be removed from the project");
        }
        if (targetUserId.equals(actorUserId) && actorRole == ProjectRole.PROJECT_ADMIN) {
            return;
        }
        if (actorRole == ProjectRole.PROJECT_ADMIN && targetRole == ProjectRole.PROJECT_ADMIN) {
            throw new AccessDeniedException("Project admins cannot remove other project admins");
        }
    }
}
