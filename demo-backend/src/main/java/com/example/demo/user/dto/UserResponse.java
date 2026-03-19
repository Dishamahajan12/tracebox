package com.example.demo.user.dto;

import java.time.Instant;

import com.example.demo.role.entity.RoleName;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        RoleName role,
        boolean active,
        Instant createdAt,
        Instant updatedAt) {
}
