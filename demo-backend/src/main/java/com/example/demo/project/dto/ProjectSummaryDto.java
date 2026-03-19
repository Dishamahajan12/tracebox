package com.example.demo.project.dto;

import com.example.demo.projectmember.entity.ProjectRole;

public record ProjectSummaryDto(
        Long id,
        String name,
        String projectKey,
        boolean archived,
        ProjectRole currentUserRole) {
}
