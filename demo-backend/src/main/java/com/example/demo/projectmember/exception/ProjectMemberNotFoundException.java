package com.example.demo.projectmember.exception;

import com.example.demo.common.exception.ResourceNotFoundException;

public class ProjectMemberNotFoundException extends ResourceNotFoundException {

    public ProjectMemberNotFoundException(Long projectId, Long userId) {
        super("Project member not found for project " + projectId + " and user " + userId);
    }
}
