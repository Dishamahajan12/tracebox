package com.example.demo.task.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.task.entity.Task;
import com.example.demo.task.entity.TaskHistory;
import com.example.demo.task.repository.TaskHistoryRepository;
import com.example.demo.task.service.TaskHistoryRecorder;
import com.example.demo.user.entity.User;

@Service
public class TaskHistoryRecorderImpl implements TaskHistoryRecorder {

    private final TaskHistoryRepository taskHistoryRepository;

    public TaskHistoryRecorderImpl(TaskHistoryRepository taskHistoryRepository) {
        this.taskHistoryRepository = taskHistoryRepository;
    }

    @Override
    @Transactional
    public void record(Task task, User actor, String action, String details) {
        TaskHistory history = new TaskHistory();
        history.setTask(task);
        history.setActor(actor);
        history.setAction(action);
        history.setDetails(details);
        taskHistoryRepository.save(history);
    }
}
