package com.example.demo.common.util;

import com.example.demo.comment.dto.CommentResponse;
import com.example.demo.comment.entity.Comment;
import com.example.demo.project.dto.ProjectResponse;
import com.example.demo.project.dto.ProjectSummaryDto;
import com.example.demo.project.entity.Project;
import com.example.demo.projectmember.dto.ProjectMemberResponse;
import com.example.demo.projectmember.entity.ProjectMember;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.report.dto.ProjectReportResponse;
import com.example.demo.report.entity.ProjectReport;
import com.example.demo.role.dto.RoleResponse;
import com.example.demo.role.entity.Role;
import com.example.demo.task.dto.TaskAssigneeOptionResponse;
import com.example.demo.task.dto.TaskAttachmentResponse;
import com.example.demo.task.dto.TaskHistoryResponse;
import com.example.demo.task.dto.TaskReferenceDto;
import com.example.demo.task.dto.TaskResponse;
import com.example.demo.task.dto.TaskSummaryDto;
import com.example.demo.task.entity.TaskAttachment;
import com.example.demo.task.entity.TaskHistory;
import com.example.demo.task.entity.Task;
import com.example.demo.task.repository.TaskAttachmentListProjection;
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
                user.getRoleName(),
                "/api/users/" + user.getId());
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
                projectMember.getTeamRole(),
                projectMember.getProjectRole(),
                projectMember.getCreatedAt());
    }

    public static TaskSummaryDto toTaskSummary(Task task) {
        return new TaskSummaryDto(
                task.getId(),
                task.getTicketNumber(),
                task.getTitle(),
                task.getStatus(),
                task.getPriority(),
                task.getAssignee() == null ? null : task.getAssignee().getId());
    }

    public static TaskReferenceDto toTaskReference(Task task) {
        if (task == null) {
            return null;
        }

        return new TaskReferenceDto(
                task.getId(),
                task.getTicketNumber(),
                task.getTitle(),
                task.getStatus(),
                task.getProject().getId(),
                task.getProject().getName());
    }

    public static TaskResponse toTaskResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTicketNumber(),
                task.getProject().getId(),
                task.getProject().getName(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                toUserSummary(task.getCreatedBy()),
                task.getAssignee() == null ? null : toUserSummary(task.getAssignee()),
                toTaskReference(task.getLinkedTicket()),
                toTaskReference(task.getOriginalReplicaTicket()),
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

    public static TaskAssigneeOptionResponse toTaskAssigneeOption(ProjectMember projectMember) {
        return new TaskAssigneeOptionResponse(
                toUserSummary(projectMember.getUser()),
                projectMember.getTeamRole(),
                projectMember.getProjectRole());
    }

    public static TaskAttachmentResponse toTaskAttachmentResponse(TaskAttachment attachment) {
        return new TaskAttachmentResponse(
                attachment.getId(),
                attachment.getTask().getId(),
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getFileSize(),
                toUserSummary(attachment.getUploadedBy()),
                "/api/tickets/" + attachment.getTask().getId() + "/files/" + attachment.getId(),
                attachment.getCreatedAt());
    }

    public static TaskAttachmentResponse toTaskAttachmentResponse(TaskAttachmentListProjection attachment) {
        return new TaskAttachmentResponse(
                attachment.getId(),
                attachment.getTaskId(),
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getFileSize(),
                new UserSummaryDto(
                        attachment.getUploadedById(),
                        attachment.getUploadedByFullName(),
                        attachment.getUploadedByEmail(),
                        attachment.getUploadedByRole() == null ? com.example.demo.role.entity.RoleName.USER : attachment.getUploadedByRole(),
                        "/api/users/" + attachment.getUploadedById()),
                "/api/tickets/" + attachment.getTaskId() + "/files/" + attachment.getId(),
                attachment.getCreatedAt());
    }

    public static TaskHistoryResponse toTaskHistoryResponse(TaskHistory history) {
        return new TaskHistoryResponse(
                history.getId(),
                history.getTask().getId(),
                history.getAction(),
                history.getDetails(),
                history.getActor() == null ? null : toUserSummary(history.getActor()),
                history.getCreatedAt());
    }

    public static ProjectReportResponse toProjectReportResponse(ProjectReport report) {
        return new ProjectReportResponse(
                report.getId(),
                report.getProject().getId(),
                report.getProject().getName(),
                report.getName(),
                report.getDescription(),
                report.getSearchText(),
                report.getStatus(),
                report.getAssignee() == null ? null : toUserSummary(report.getAssignee()),
                report.getSortOrder(),
                toUserSummary(report.getCreatedBy()),
                report.getCreatedAt(),
                report.getUpdatedAt());
    }
}
