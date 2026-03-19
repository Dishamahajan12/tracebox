package com.example.demo.project.exception;

import com.example.demo.common.exception.ResourceNotFoundException;

public class ProjectNotFoundException extends ResourceNotFoundException {

    public ProjectNotFoundException(Long projectId) {
        super("Project not found with id: " + projectId);
    }
}
