package com.example.demo.task.dto;

import com.example.demo.task.entity.TaskStatus;

public record TaskReferenceDto(
        Long id,
        String ticketNumber,
        String title,
        TaskStatus status,
        Long projectId,
        String projectName) {
}
