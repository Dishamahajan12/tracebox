package com.example.demo.task.dto;

import java.time.Instant;

import com.example.demo.user.dto.UserSummaryDto;

public record TaskHistoryResponse(
        Long id,
        Long taskId,
        String action,
        String details,
        UserSummaryDto actor,
        Instant createdAt) {
}
