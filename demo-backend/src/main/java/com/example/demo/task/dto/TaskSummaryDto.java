package com.example.demo.task.dto;

import com.example.demo.task.entity.TaskPriority;
import com.example.demo.task.entity.TaskStatus;

public record TaskSummaryDto(
        Long id,
        String ticketNumber,
        String title,
        TaskStatus status,
        TaskPriority priority,
        Long assigneeId) {
}
