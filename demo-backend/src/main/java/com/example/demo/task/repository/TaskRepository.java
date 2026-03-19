package com.example.demo.task.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.task.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);
}
