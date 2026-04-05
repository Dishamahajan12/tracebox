package com.example.demo.task.service;

import com.example.demo.task.entity.Task;
import com.example.demo.user.entity.User;

public interface TaskHistoryRecorder {

    void record(Task task, User actor, String action, String details);
}
