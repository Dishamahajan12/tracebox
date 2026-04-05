package com.example.demo.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DuplicateTicketCheckRequest(
        @NotBlank(message = "Ticket title is required")
        @Size(max = 160, message = "Ticket title must be at most 160 characters")
        String title,
        @Size(max = 4000, message = "Description must be at most 4000 characters")
        String description) {
}
