package com.example.demo.admin.dto;

import com.example.demo.role.entity.RoleName;

import jakarta.validation.constraints.NotNull;

public record AdminUserUpdateRequest(
        @NotNull(message = "Role is required")
        RoleName role,
        @NotNull(message = "Active flag is required")
        Boolean active) {
}
