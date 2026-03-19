package com.example.demo.common.util;

import com.example.demo.comment.dto.CommentResponse;
import com.example.demo.comment.entity.Comment;
import com.example.demo.project.dto.ProjectResponse;
import com.example.demo.project.dto.ProjectSummaryDto;
import com.example.demo.project.entity.Project;
import com.example.demo.projectmember.dto.ProjectMemberResponse;
import com.example.demo.projectmember.entity.ProjectMember;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.role.dto.RoleResponse;
import com.example.demo.role.entity.Role;
import com.example.demo.task.dto.TaskResponse;
import com.example.demo.task.dto.TaskSummaryDto;
import com.example.demo.task.entity.Task;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.dto.UserSummaryDto;
import com.example.demo.user.entity.User;

public final class DtoMapper {

    private DtoMapper() {
    }

    public static UserSummaryDto toUserSummary(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRoleName());
    }

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRoleName(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    public static RoleResponse toRoleResponse(Role role) {
        return new RoleResponse(role.getId(), role.getName());
    }

    public static ProjectSummaryDto toProjectSummary(Project project, ProjectRole currentUserRole) {
        return new ProjectSummaryDto(
                project.getId(),
                project.getName(),
                project.getProjectKey(),
                project.isArchived(),
                currentUserRole);
    }

    public static ProjectResponse toProjectResponse(Project project, ProjectRole currentUserRole) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getProjectKey(),
                project.getDescription(),
                project.isArchived(),
                toUserSummary(project.getCreatedBy()),
                currentUserRole,
                project.getCreatedAt(),
                project.getUpdatedAt());
    }

    public static ProjectMemberResponse toProjectMemberResponse(ProjectMember projectMember) {
        return new ProjectMemberResponse(
                projectMember.getId(),
                projectMember.getProject().getId(),
                toUserSummary(projectMember.getUser()),
                projectMember.getProjectRole(),
                projectMember.getCreatedAt());
    }

    public static TaskSummaryDto toTaskSummary(Task task) {
        return new TaskSummaryDto(
                task.getId(),
                task.getTitle(),
                task.getStatus(),
                task.getPriority(),
                task.getAssignee() == null ? null : task.getAssignee().getId());
    }

    public static TaskResponse toTaskResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getProject().getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                toUserSummary(task.getCreatedBy()),
                task.getAssignee() == null ? null : toUserSummary(task.getAssignee()),
                task.getCreatedAt(),
                task.getUpdatedAt());
    }

    public static CommentResponse toCommentResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getTask().getId(),
                comment.getContent(),
                toUserSummary(comment.getAuthor()),
                comment.getCreatedAt(),
                comment.getUpdatedAt());
    }
}
