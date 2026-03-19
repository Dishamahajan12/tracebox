package com.example.demo.task.exception;

import com.example.demo.common.exception.ResourceNotFoundException;

public class TaskNotFoundException extends ResourceNotFoundException {

    public TaskNotFoundException(Long taskId) {
        super("Task not found with id: " + taskId);
    }
}
