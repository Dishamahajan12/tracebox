package com.example.demo.task.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.demo.task.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    List<Task> findAllByTicketNumberIsNull();

    @EntityGraph(attributePaths = {
            "project",
            "createdBy",
            "createdBy.role",
            "assignee",
            "assignee.role",
            "linkedTicket",
            "linkedTicket.project",
            "originalReplicaTicket",
            "originalReplicaTicket.project"
    })
    Optional<Task> findDetailedById(Long taskId);

    @EntityGraph(attributePaths = { "project" })
    List<Task> findAllByOriginalReplicaTicketIdOrderByCreatedAtDesc(Long taskId);
}
