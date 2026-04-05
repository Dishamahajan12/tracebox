package com.example.demo.user.dto;

import com.example.demo.role.entity.RoleName;

public record UserSummaryDto(
        Long id,
        String fullName,
        String email,
        RoleName role,
        String profileUrl) {
}
