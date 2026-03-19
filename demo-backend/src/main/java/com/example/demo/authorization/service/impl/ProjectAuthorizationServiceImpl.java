package com.example.demo.authorization.service.impl;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.demo.authorization.exception.AccessDeniedException;
import com.example.demo.authorization.service.ProjectAuthorizationService;
import com.example.demo.projectmember.entity.ProjectMember;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.projectmember.exception.ProjectMemberNotFoundException;
import com.example.demo.projectmember.repository.ProjectMemberRepository;

@Service
public class ProjectAuthorizationServiceImpl implements ProjectAuthorizationService {

    private static final Map<ProjectRole, Integer> ROLE_RANKS = Map.of(
            ProjectRole.PROJECT_OWNER, 4,
            ProjectRole.PROJECT_ADMIN, 3,
            ProjectRole.MEMBER, 2,
            ProjectRole.VIEWER, 1);

    private final ProjectMemberRepository projectMemberRepository;

    public ProjectAuthorizationServiceImpl(ProjectMemberRepository projectMemberRepository) {
        this.projectMemberRepository = projectMemberRepository;
    }

    @Override
    public ProjectMember requireProjectRole(Long projectId, Long userId, ProjectRole minimumRole) {
        ProjectMember membership = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ProjectMemberNotFoundException(projectId, userId));

        if (!hasAtLeastRole(membership.getProjectRole(), minimumRole)) {
            throw new AccessDeniedException("Insufficient project permissions");
        }

        return membership;
    }

    @Override
    public boolean hasProjectRole(Long projectId, Long userId, ProjectRole minimumRole) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(member -> hasAtLeastRole(member.getProjectRole(), minimumRole))
                .orElse(false);
    }

    @Override
    public boolean hasAtLeastRole(ProjectRole actualRole, ProjectRole minimumRole) {
        return ROLE_RANKS.get(actualRole) >= ROLE_RANKS.get(minimumRole);
    }
}
