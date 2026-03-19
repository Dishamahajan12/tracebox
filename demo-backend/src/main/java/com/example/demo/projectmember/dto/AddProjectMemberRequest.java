package com.example.demo.projectmember.dto;

import com.example.demo.projectmember.entity.ProjectRole;

import jakarta.validation.constraints.NotNull;

public record AddProjectMemberRequest(
        @NotNull(message = "User id is required")
        Long userId,
        @NotNull(message = "Project role is required")
        ProjectRole projectRole) {
}
