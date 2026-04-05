package com.example.demo.task.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.task.entity.TaskHistory;

public interface TaskHistoryRepository extends JpaRepository<TaskHistory, Long> {

    @EntityGraph(attributePaths = { "task", "actor", "actor.role" })
    List<TaskHistory> findAllByTaskId(Long taskId, Sort sort);
}
