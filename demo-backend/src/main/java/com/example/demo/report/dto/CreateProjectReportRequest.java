package com.example.demo.report.dto;

import com.example.demo.common.model.CreatedAtSort;
import com.example.demo.task.entity.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectReportRequest(
        @NotBlank(message = "Report name is required")
        @Size(max = 160, message = "Report name must be at most 160 characters")
        String name,
        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,
        @Size(max = 255, message = "Search text must be at most 255 characters")
        String searchText,
        TaskStatus status,
        Long assigneeId,
        CreatedAtSort sortOrder) {
}
