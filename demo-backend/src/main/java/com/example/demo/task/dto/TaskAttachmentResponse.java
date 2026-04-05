package com.example.demo.task.dto;

import java.time.Instant;

import com.example.demo.user.dto.UserSummaryDto;

public record TaskAttachmentResponse(
        Long id,
        Long taskId,
        String fileName,
        String contentType,
        long fileSize,
        UserSummaryDto uploadedBy,
        String downloadUrl,
        Instant createdAt) {
}
