package com.example.demo.task.service;

import java.util.List;

import com.example.demo.task.dto.DuplicateTicketCheckRequest;
import com.example.demo.task.entity.Task;

public interface TaskDuplicateDetector {

    TaskDuplicateDetectionResult findBestMatch(DuplicateTicketCheckRequest request, List<Task> candidates);
}
