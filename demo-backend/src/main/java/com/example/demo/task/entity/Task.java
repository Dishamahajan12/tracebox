package com.example.demo.task.entity;

import java.time.LocalDate;

import com.example.demo.common.entity.BaseAuditEntity;
import com.example.demo.project.entity.Project;
import com.example.demo.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "tasks")
public class Task extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(name = "ticket_number", length = 30, unique = true)
    private String ticketNumber;

    @Column(length = 4000)
    private String description;

    @Convert(converter = TaskStatusConverter.class)
    @Column(nullable = false, length = 50)
    private TaskStatus status = TaskStatus.NEW;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column
    private LocalDate dueDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_ticket_id")
    private Task linkedTicket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_replica_ticket_id")
    private Task originalReplicaTicket;

    public Task() {
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTicketNumber() {
        return ticketNumber == null && id != null ? "TKT-" + (id + 100) : ticketNumber;
    }

    public String getStoredTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public TaskPriority getPriority() {
        return priority;
    }

    public void setPriority(TaskPriority priority) {
        this.priority = priority;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public User getAssignee() {
        return assignee;
    }

    public void setAssignee(User assignee) {
        this.assignee = assignee;
    }

    public Task getLinkedTicket() {
        return linkedTicket;
    }

    public void setLinkedTicket(Task linkedTicket) {
        this.linkedTicket = linkedTicket;
    }

    public Task getOriginalReplicaTicket() {
        return originalReplicaTicket;
    }

    public void setOriginalReplicaTicket(Task originalReplicaTicket) {
        this.originalReplicaTicket = originalReplicaTicket;
    }
}
