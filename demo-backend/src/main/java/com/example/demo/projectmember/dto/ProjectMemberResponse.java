package com.example.demo.projectmember.dto;

import java.time.Instant;

import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.user.dto.UserSummaryDto;

public record ProjectMemberResponse(
        Long id,
        Long projectId,
        UserSummaryDto user,
        ProjectRole projectRole,
        Instant createdAt) {
}
