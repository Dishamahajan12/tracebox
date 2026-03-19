package com.example.demo.task.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.task.dto.CreateTaskRequest;
import com.example.demo.task.dto.TaskResponse;
import com.example.demo.task.dto.UpdateTaskRequest;
import com.example.demo.task.service.TaskService;

import jakarta.validation.Valid;

@RestController
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", taskService.createTask(projectId, request)));
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getProjectTasks(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched successfully", taskService.getProjectTasks(projectId)));
    }

    @GetMapping("/api/tasks/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success("Task fetched successfully", taskService.getTask(taskId)));
    }

    @PutMapping("/api/tasks/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", taskService.updateTask(taskId, request)));
    }
}
