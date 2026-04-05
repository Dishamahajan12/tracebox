package com.example.demo.task.dto;

import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.projectmember.entity.ProjectTeamRole;
import com.example.demo.user.dto.UserSummaryDto;

public record TaskAssigneeOptionResponse(
        UserSummaryDto user,
        ProjectTeamRole projectRole,
        ProjectRole accessRole) {
}
