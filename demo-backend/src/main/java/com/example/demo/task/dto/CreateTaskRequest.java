package com.example.demo.task.dto;

import java.time.LocalDate;

import com.example.demo.task.entity.TaskPriority;
import com.example.demo.task.entity.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTaskRequest(
        @NotBlank(message = "Task title is required")
        @Size(max = 160, message = "Task title must be at most 160 characters")
        String title,
        @Size(max = 4000, message = "Description must be at most 4000 characters")
        String description,
        @NotNull(message = "Priority is required")
        TaskPriority priority,
        TaskStatus status,
        Long assigneeId,
        LocalDate dueDate) {
}
