package com.example.demo.task.service;

import java.util.List;

import com.example.demo.task.dto.CreateTaskRequest;
import com.example.demo.task.dto.TaskResponse;
import com.example.demo.task.dto.UpdateTaskRequest;
import com.example.demo.task.entity.Task;

public interface TaskService {

    TaskResponse createTask(Long projectId, CreateTaskRequest request);

    List<TaskResponse> getProjectTasks(Long projectId);

    TaskResponse getTask(Long taskId);

    TaskResponse updateTask(Long taskId, UpdateTaskRequest request);

    Task getRequiredTask(Long taskId);
}
