package com.example.demo.authorization.service.impl;

import org.springframework.stereotype.Service;

import com.example.demo.authorization.exception.AccessDeniedException;
import com.example.demo.authorization.service.AccessDecisionService;
import com.example.demo.authorization.service.ProjectAuthorizationService;
import com.example.demo.projectmember.entity.ProjectRole;

@Service
public class AccessDecisionServiceImpl implements AccessDecisionService {

    private final ProjectAuthorizationService projectAuthorizationService;

    public AccessDecisionServiceImpl(ProjectAuthorizationService projectAuthorizationService) {
        this.projectAuthorizationService = projectAuthorizationService;
    }

    @Override
    public void requireCommentModificationAccess(Long projectId, Long actorUserId, Long authorUserId) {
        if (actorUserId.equals(authorUserId)) {
            return;
        }
        if (!projectAuthorizationService.hasProjectRole(projectId, actorUserId, ProjectRole.PROJECT_ADMIN)) {
            throw new AccessDeniedException("You cannot modify another member's comment");
        }
    }
}
