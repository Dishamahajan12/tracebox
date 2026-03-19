package com.example.demo.comment.dto;

import java.time.Instant;

import com.example.demo.user.dto.UserSummaryDto;

public record CommentResponse(
        Long id,
        Long taskId,
        String content,
        UserSummaryDto author,
        Instant createdAt,
        Instant updatedAt) {
}
