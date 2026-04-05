package com.example.demo.task.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.example.demo.task.dto.CreateTaskRequest;
import com.example.demo.task.dto.TaskAssigneeOptionResponse;
import com.example.demo.task.dto.TaskAttachmentDownload;
import com.example.demo.task.dto.TaskAttachmentResponse;
import com.example.demo.task.dto.TaskHistoryResponse;
import com.example.demo.task.dto.TaskReferenceDto;
import com.example.demo.task.dto.TaskResponse;
import com.example.demo.task.dto.UpdateTaskRequest;
import com.example.demo.task.entity.Task;
import com.example.demo.task.entity.TaskStatus;

public interface TaskService {

    TaskResponse createTask(Long projectId, CreateTaskRequest request);

    List<TaskResponse> getProjectTasks(Long projectId, String search, String sort, TaskStatus status, Long assigneeId);

    TaskResponse getTask(Long taskId);

    TaskResponse updateTask(Long taskId, UpdateTaskRequest request);

    void deleteTask(Long taskId);

    List<TaskAssigneeOptionResponse> getProjectAssigneeOptions(Long projectId, String search);

    List<TaskReferenceDto> lookupTickets(String search, Long projectId, Long excludeTaskId);

    List<TaskReferenceDto> getDuplicateTickets(Long taskId);

    List<TaskAttachmentResponse> getTaskAttachments(Long taskId);

    TaskAttachmentResponse uploadTaskAttachment(Long taskId, MultipartFile file);

    TaskAttachmentDownload downloadTaskAttachment(Long taskId, Long attachmentId);

    List<TaskHistoryResponse> getTaskHistory(Long taskId);

    Task getRequiredTask(Long taskId);
}
