package com.example.demo.report.dto;

import java.time.Instant;

import com.example.demo.common.model.CreatedAtSort;
import com.example.demo.task.entity.TaskStatus;
import com.example.demo.user.dto.UserSummaryDto;

public record ProjectReportResponse(
        Long id,
        Long projectId,
        String projectName,
        String name,
        String description,
        String searchText,
        TaskStatus status,
        UserSummaryDto assignee,
        CreatedAtSort sortOrder,
        UserSummaryDto createdBy,
        Instant createdAt,
        Instant updatedAt) {
}
