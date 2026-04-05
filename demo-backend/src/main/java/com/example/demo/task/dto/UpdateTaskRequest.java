package com.example.demo.task.dto;

import java.time.LocalDate;

import com.example.demo.task.entity.TaskPriority;
import com.example.demo.task.entity.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateTaskRequest(
        @NotBlank(message = "Ticket title is required")
        @Size(max = 160, message = "Ticket title must be at most 160 characters")
        String title,
        @Size(max = 4000, message = "Description must be at most 4000 characters")
        String description,
        @NotNull(message = "Ticket status is required")
        TaskStatus status,
        @NotNull(message = "Ticket priority is required")
        TaskPriority priority,
        Long assigneeId,
        LocalDate dueDate,
        Long linkedTicketId,
        Long originalReplicaTicketId) {
}
