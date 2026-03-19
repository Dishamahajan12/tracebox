package com.example.demo.authorization.service;

import com.example.demo.projectmember.entity.ProjectMember;
import com.example.demo.projectmember.entity.ProjectRole;

public interface ProjectAuthorizationService {

    ProjectMember requireProjectRole(Long projectId, Long userId, ProjectRole minimumRole);

    boolean hasProjectRole(Long projectId, Long userId, ProjectRole minimumRole);

    boolean hasAtLeastRole(ProjectRole actualRole, ProjectRole minimumRole);
}
