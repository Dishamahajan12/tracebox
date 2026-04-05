package com.example.demo.task.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.task.dto.CreateTaskRequest;
import com.example.demo.task.dto.TaskAssigneeOptionResponse;
import com.example.demo.task.dto.TaskAttachmentDownload;
import com.example.demo.task.dto.TaskAttachmentResponse;
import com.example.demo.task.dto.TaskHistoryResponse;
import com.example.demo.task.dto.TaskReferenceDto;
import com.example.demo.task.dto.TaskResponse;
import com.example.demo.task.dto.UpdateTaskRequest;
import com.example.demo.task.entity.TaskStatus;
import com.example.demo.task.service.TaskService;

import jakarta.validation.Valid;

@RestController
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping({ "/api/projects/{projectId}/tasks", "/api/projects/{projectId}/tickets" })
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ticket created successfully", taskService.createTask(projectId, request)));
    }

    @GetMapping({ "/api/projects/{projectId}/tasks", "/api/projects/{projectId}/tickets" })
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getProjectTasks(
            @PathVariable Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Long assigneeId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Tickets fetched successfully",
                taskService.getProjectTasks(projectId, search, sort, status, assigneeId)));
    }

    @GetMapping({ "/api/tasks/{taskId}", "/api/tickets/{taskId}" })
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success("Ticket fetched successfully", taskService.getTask(taskId)));
    }

    @PutMapping({ "/api/tasks/{taskId}", "/api/tickets/{taskId}" })
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Ticket updated successfully", taskService.updateTask(taskId, request)));
    }

    @DeleteMapping({ "/api/tasks/{taskId}", "/api/tickets/{taskId}" })
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.ok(ApiResponse.success("Ticket deleted successfully"));
    }

    @GetMapping({ "/api/tasks/lookup", "/api/tickets/lookup" })
    public ResponseEntity<ApiResponse<List<TaskReferenceDto>>> lookupTickets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long excludeTaskId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket lookup fetched successfully",
                taskService.lookupTickets(search, projectId, excludeTaskId)));
    }

    @GetMapping({ "/api/projects/{projectId}/tasks/assignees", "/api/projects/{projectId}/tickets/assignees" })
    public ResponseEntity<ApiResponse<List<TaskAssigneeOptionResponse>>> getProjectAssigneeOptions(
            @PathVariable Long projectId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(
                "Assignee options fetched successfully",
                taskService.getProjectAssigneeOptions(projectId, search)));
    }

    @GetMapping({ "/api/tasks/{taskId}/duplicates", "/api/tickets/{taskId}/duplicates" })
    public ResponseEntity<ApiResponse<List<TaskReferenceDto>>> getDuplicateTickets(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Duplicate tickets fetched successfully",
                taskService.getDuplicateTickets(taskId)));
    }

    @GetMapping({ "/api/tasks/{taskId}/attachments", "/api/tickets/{taskId}/files" })
    public ResponseEntity<ApiResponse<List<TaskAttachmentResponse>>> getTaskAttachments(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket files fetched successfully",
                taskService.getTaskAttachments(taskId)));
    }

    @PostMapping(
            path = { "/api/tasks/{taskId}/attachments", "/api/tickets/{taskId}/files" },
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TaskAttachmentResponse>> uploadTaskAttachment(
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Ticket file uploaded successfully",
                        taskService.uploadTaskAttachment(taskId, file)));
    }

    @GetMapping({ "/api/tasks/{taskId}/attachments/{attachmentId}", "/api/tickets/{taskId}/files/{attachmentId}" })
    public ResponseEntity<byte[]> downloadTaskAttachment(
            @PathVariable Long taskId,
            @PathVariable Long attachmentId) {
        TaskAttachmentDownload download = taskService.downloadTaskAttachment(taskId, attachmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.content());
    }

    @GetMapping({ "/api/tasks/{taskId}/history", "/api/tickets/{taskId}/history" })
    public ResponseEntity<ApiResponse<List<TaskHistoryResponse>>> getTaskHistory(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket history fetched successfully",
                taskService.getTaskHistory(taskId)));
    }
}
