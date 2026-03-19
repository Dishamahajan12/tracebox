package com.example.demo.role.dto;

import com.example.demo.role.entity.RoleName;

public record RoleResponse(
        Long id,
        RoleName name) {
}
