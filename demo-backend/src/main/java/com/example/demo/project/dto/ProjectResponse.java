package com.example.demo.project.dto;

import java.time.Instant;

import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.user.dto.UserSummaryDto;

public record ProjectResponse(
        Long id,
        String name,
        String projectKey,
        String description,
        boolean archived,
        UserSummaryDto createdBy,
        ProjectRole currentUserRole,
        Instant createdAt,
        Instant updatedAt) {
}
