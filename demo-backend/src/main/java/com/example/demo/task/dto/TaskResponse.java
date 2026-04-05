package com.example.demo.task.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.example.demo.task.entity.TaskPriority;
import com.example.demo.task.entity.TaskStatus;
import com.example.demo.user.dto.UserSummaryDto;

public record TaskResponse(
        Long id,
        String ticketNumber,
        Long projectId,
        String projectName,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        UserSummaryDto createdBy,
        UserSummaryDto assignee,
        TaskReferenceDto linkedTicket,
        TaskReferenceDto originalReplicaTicket,
        Instant createdAt,
        Instant updatedAt) {
}
