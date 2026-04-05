package com.example.demo.projectmember.dto;

import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.projectmember.entity.ProjectTeamRole;

import jakarta.validation.constraints.NotNull;

public record AddProjectMemberRequest(
        @NotNull(message = "User id is required")
        Long userId,
        @NotNull(message = "Project role is required")
        ProjectTeamRole projectRole,
        ProjectRole accessRole) {
}
