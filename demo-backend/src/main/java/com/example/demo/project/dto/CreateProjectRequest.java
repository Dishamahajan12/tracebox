package com.example.demo.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(max = 120, message = "Project name must be at most 120 characters")
        String name,
        @NotBlank(message = "Project key is required")
        @Pattern(regexp = "^[A-Z][A-Z0-9_]{1,19}$", message = "Project key must be uppercase and 2-20 characters")
        String projectKey,
        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description) {
}
