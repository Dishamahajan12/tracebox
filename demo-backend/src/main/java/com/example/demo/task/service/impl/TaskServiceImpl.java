package com.example.demo.task.service.impl;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.authorization.exception.AccessDeniedException;
import com.example.demo.authorization.service.ProjectAuthorizationService;
import com.example.demo.common.exception.BadRequestException;
import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.common.model.CreatedAtSort;
import com.example.demo.common.security.SecurityUtils;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.project.entity.Project;
import com.example.demo.project.service.ProjectService;
import com.example.demo.projectmember.entity.ProjectMember;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.projectmember.entity.ProjectTeamRole;
import com.example.demo.projectmember.repository.ProjectMemberRepository;
import com.example.demo.task.dto.CreateTaskRequest;
import com.example.demo.task.dto.TaskAssigneeOptionResponse;
import com.example.demo.task.dto.TaskAttachmentDownload;
import com.example.demo.task.dto.TaskAttachmentResponse;
import com.example.demo.task.dto.TaskHistoryResponse;
import com.example.demo.task.dto.TaskReferenceDto;
import com.example.demo.task.dto.TaskResponse;
import com.example.demo.task.dto.UpdateTaskRequest;
import com.example.demo.task.entity.Task;
import com.example.demo.task.entity.TaskAttachment;
import com.example.demo.task.entity.TaskPriority;
import com.example.demo.task.entity.TaskStatus;
import com.example.demo.task.exception.TaskNotFoundException;
import com.example.demo.task.repository.TaskAttachmentRepository;
import com.example.demo.task.repository.TaskHistoryRepository;
import com.example.demo.task.repository.TaskRepository;
import com.example.demo.task.service.TaskHistoryRecorder;
import com.example.demo.task.service.TaskService;
import com.example.demo.user.entity.User;
import com.example.demo.user.service.UserService;

import jakarta.persistence.criteria.Predicate;

@Service
@Transactional
public class TaskServiceImpl implements TaskService {

    private static final String DEFAULT_FILE_CONTENT_TYPE = "application/octet-stream";

    private final TaskRepository taskRepository;
    private final ProjectService projectService;
    private final UserService userService;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectAuthorizationService projectAuthorizationService;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskHistoryRecorder taskHistoryRecorder;

    public TaskServiceImpl(
            TaskRepository taskRepository,
            ProjectService projectService,
            UserService userService,
            ProjectMemberRepository projectMemberRepository,
            ProjectAuthorizationService projectAuthorizationService,
            TaskAttachmentRepository taskAttachmentRepository,
            TaskHistoryRepository taskHistoryRepository,
            TaskHistoryRecorder taskHistoryRecorder) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
        this.userService = userService;
        this.projectMemberRepository = projectMemberRepository;
        this.projectAuthorizationService = projectAuthorizationService;
        this.taskAttachmentRepository = taskAttachmentRepository;
        this.taskHistoryRepository = taskHistoryRepository;
        this.taskHistoryRecorder = taskHistoryRecorder;
    }

    @Override
    public TaskResponse createTask(Long projectId, CreateTaskRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);

        Project project = projectService.getRequiredProject(projectId);
        User creator = userService.getRequiredUser(currentUserId);

        Task task = new Task();
        task.setProject(project);
        task.setCreatedBy(creator);
        applyTaskValues(
                task,
                projectId,
                currentUserId,
                request.title(),
                request.description(),
                request.priority(),
                request.status() == null ? TaskStatus.NEW : request.status(),
                request.assigneeId(),
                request.dueDate(),
                request.linkedTicketId(),
                request.originalReplicaTicketId());

        Task savedTask = taskRepository.save(task);
        ensureTicketNumber(savedTask);
        savedTask = taskRepository.save(savedTask);
        taskHistoryRecorder.record(
                savedTask,
                creator,
                "TICKET_CREATED",
                "Ticket " + savedTask.getTicketNumber() + " created");

        return DtoMapper.toTaskResponse(savedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getProjectTasks(Long projectId, String search, String sort, TaskStatus status, Long assigneeId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.VIEWER);

        if (assigneeId != null && !projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId)) {
            throw new BadRequestException("Assignee must be a project member");
        }

        Specification<Task> specification = Specification.where(projectIdEquals(projectId))
                .and(searchMatches(normalizeSearch(search)))
                .and(statusEquals(status))
                .and(assigneeEquals(assigneeId));

        List<Task> tasks = taskRepository.findAll(specification, CreatedAtSort.from(sort).toSort());
        ensureTicketNumbers(tasks);
        return tasks.stream()
                .map(DtoMapper::toTaskResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long taskId) {
        Task task = getTaskForRead(taskId);
        return DtoMapper.toTaskResponse(task);
    }

    @Override
    public TaskResponse updateTask(Long taskId, UpdateTaskRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = getRequiredTask(taskId);
        Long projectId = task.getProject().getId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);

        TaskSnapshot before = TaskSnapshot.from(task);
        applyTaskValues(
                task,
                projectId,
                currentUserId,
                request.title(),
                request.description(),
                request.priority(),
                request.status(),
                request.assigneeId(),
                request.dueDate(),
                request.linkedTicketId(),
                request.originalReplicaTicketId());

        Task savedTask = taskRepository.save(task);
        ensureTicketNumber(savedTask);
        User actor = userService.getRequiredUser(currentUserId);
        taskHistoryRecorder.record(
                savedTask,
                actor,
                "TICKET_UPDATED",
                buildUpdateDetails(before, savedTask));

        return DtoMapper.toTaskResponse(savedTask);
    }

    @Override
    public void deleteTask(Long taskId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = getRequiredTask(taskId);
        Long projectId = task.getProject().getId();
        ProjectMember membership = projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);
        boolean isCreator = task.getCreatedBy() != null && Objects.equals(task.getCreatedBy().getId(), currentUserId);
        ProjectTeamRole teamRole = membership.getTeamRole();
        if (!isCreator
                && teamRole != ProjectTeamRole.MANAGER
                && teamRole != ProjectTeamRole.SENIOR_MANAGER) {
            throw new AccessDeniedException("Only the ticket creator, managers, and senior managers can delete tickets");
        }
        taskRepository.delete(task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskAssigneeOptionResponse> getProjectAssigneeOptions(Long projectId, String search) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.VIEWER);
        return projectMemberRepository.searchProjectMembers(projectId, normalizeSearch(search)).stream()
                .map(DtoMapper::toTaskAssigneeOption)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskReferenceDto> lookupTickets(String search, Long projectId, Long excludeTaskId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (projectId != null) {
            projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.VIEWER);
        }

        List<Long> accessibleProjectIds = projectMemberRepository.findProjectIdsByUserId(currentUserId);
        if (accessibleProjectIds.isEmpty()) {
            return List.of();
        }

        Specification<Task> specification = Specification.where(projectIdIn(accessibleProjectIds))
                .and(projectId == null ? null : projectIdEquals(projectId))
                .and(excludeTaskId == null ? null : taskIdNotEquals(excludeTaskId))
                .and(searchMatches(normalizeSearch(search)));

        List<Task> tasks = taskRepository.findAll(
                specification,
                PageRequest.of(0, 20, CreatedAtSort.NEWEST.toSort()))
                .getContent();
        ensureTicketNumbers(tasks);
        return tasks.stream()
                .map(DtoMapper::toTaskReference)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskReferenceDto> getDuplicateTickets(Long taskId) {
        getTaskForRead(taskId);
        List<Task> tasks = taskRepository.findAllByOriginalReplicaTicketIdOrderByCreatedAtDesc(taskId);
        ensureTicketNumbers(tasks);
        return tasks.stream()
                .map(DtoMapper::toTaskReference)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskAttachmentResponse> getTaskAttachments(Long taskId) {
        getTaskForRead(taskId);
        return taskAttachmentRepository.findAttachmentMetadataByTaskId(taskId).stream()
                .map(DtoMapper::toTaskAttachmentResponse)
                .toList();
    }

    @Override
    public TaskAttachmentResponse uploadTaskAttachment(Long taskId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("A file is required");
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = getRequiredTask(taskId);
        projectAuthorizationService.requireProjectRole(task.getProject().getId(), currentUserId, ProjectRole.MEMBER);

        TaskAttachment attachment = new TaskAttachment();
        attachment.setTask(task);
        attachment.setUploadedBy(userService.getRequiredUser(currentUserId));
        attachment.setFileName(file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
                ? "attachment"
                : file.getOriginalFilename().trim());
        attachment.setContentType(file.getContentType() == null || file.getContentType().isBlank()
                ? DEFAULT_FILE_CONTENT_TYPE
                : file.getContentType());
        attachment.setFileSize(file.getSize());

        try {
            attachment.setContent(file.getBytes());
        } catch (IOException exception) {
            throw new BadRequestException("Unable to read the uploaded file");
        }

        TaskAttachment savedAttachment = taskAttachmentRepository.save(attachment);
        taskHistoryRecorder.record(
                task,
                savedAttachment.getUploadedBy(),
                "FILE_UPLOADED",
                "File uploaded: " + savedAttachment.getFileName());
        return DtoMapper.toTaskAttachmentResponse(savedAttachment);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskAttachmentDownload downloadTaskAttachment(Long taskId, Long attachmentId) {
        getTaskForRead(taskId);
        TaskAttachment attachment = taskAttachmentRepository.findByIdAndTaskId(attachmentId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with id: " + attachmentId));
        return new TaskAttachmentDownload(
                attachment.getFileName(),
                attachment.getContentType() == null ? DEFAULT_FILE_CONTENT_TYPE : attachment.getContentType(),
                attachment.getContent());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskHistoryResponse> getTaskHistory(Long taskId) {
        getTaskForRead(taskId);
        return taskHistoryRepository.findAllByTaskId(taskId, CreatedAtSort.NEWEST.toSort()).stream()
                .map(DtoMapper::toTaskHistoryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Task getRequiredTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
    }

    private Task getTaskForRead(Long taskId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = taskRepository.findDetailedById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        projectAuthorizationService.requireProjectRole(task.getProject().getId(), currentUserId, ProjectRole.VIEWER);
        ensureTicketNumber(task);
        return task;
    }

    private void applyTaskValues(
            Task task,
            Long projectId,
            Long currentUserId,
            String title,
            String description,
            TaskPriority priority,
            TaskStatus status,
            Long assigneeId,
            LocalDate dueDate,
            Long linkedTicketId,
            Long originalReplicaTicketId) {
        task.setTitle(title.trim());
        task.setDescription(normalizeNullableText(description));
        task.setPriority(priority);
        task.setStatus(status == null ? TaskStatus.NEW : status);
        task.setDueDate(dueDate);
        task.setAssignee(resolveAssignee(projectId, assigneeId));
        task.setLinkedTicket(resolveReferencedTicket(task.getId(), linkedTicketId, currentUserId, "Linked ticket"));
        task.setOriginalReplicaTicket(resolveReferencedTicket(
                task.getId(),
                originalReplicaTicketId,
                currentUserId,
                "Original replica ticket"));
    }

    private User resolveAssignee(Long projectId, Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId)) {
            throw new BadRequestException("Assignee must be a project member");
        }
        return userService.getRequiredUser(assigneeId);
    }

    private Task resolveReferencedTicket(Long taskId, Long referencedTaskId, Long currentUserId, String fieldLabel) {
        if (referencedTaskId == null) {
            return null;
        }
        if (taskId != null && taskId.equals(referencedTaskId)) {
            throw new BadRequestException(fieldLabel + " cannot reference the same ticket");
        }

        Task referencedTask = getRequiredTask(referencedTaskId);
        if (!projectAuthorizationService.hasProjectRole(
                referencedTask.getProject().getId(),
                currentUserId,
                ProjectRole.VIEWER)) {
            throw new BadRequestException(fieldLabel + " must reference a ticket you can access");
        }

        ensureTicketNumber(referencedTask);
        return referencedTask;
    }

    private void ensureTicketNumbers(List<Task> tasks) {
        List<Task> tasksToUpdate = tasks.stream()
                .filter(task -> task.getStoredTicketNumber() == null)
                .peek(this::ensureTicketNumber)
                .toList();
        if (!tasksToUpdate.isEmpty()) {
            taskRepository.saveAll(tasksToUpdate);
        }
    }

    private void ensureTicketNumber(Task task) {
        if (task.getStoredTicketNumber() == null) {
            task.setTicketNumber(formatTicketNumber(task.getId()));
        }
    }

    private String buildUpdateDetails(TaskSnapshot before, Task task) {
        List<String> changes = new ArrayList<>();

        if (!Objects.equals(before.title(), task.getTitle())) {
            changes.add("title updated");
        }
        if (!Objects.equals(before.description(), task.getDescription())) {
            changes.add("description updated");
        }
        if (!Objects.equals(before.status(), task.getStatus())) {
            changes.add("status: " + before.status() + " -> " + task.getStatus());
        }
        if (!Objects.equals(before.priority(), task.getPriority())) {
            changes.add("priority: " + before.priority() + " -> " + task.getPriority());
        }
        if (!Objects.equals(before.dueDate(), task.getDueDate())) {
            changes.add("due date: " + valueOrNone(before.dueDate()) + " -> " + valueOrNone(task.getDueDate()));
        }
        if (!Objects.equals(before.assigneeId(), task.getAssignee() == null ? null : task.getAssignee().getId())) {
            changes.add("assignee: " + before.assigneeLabel() + " -> " + userLabel(task.getAssignee()));
        }
        if (!Objects.equals(before.linkedTicketId(), task.getLinkedTicket() == null ? null : task.getLinkedTicket().getId())) {
            changes.add("linked ticket: " + before.linkedTicketLabel() + " -> " + taskLabel(task.getLinkedTicket()));
        }
        if (!Objects.equals(
                before.originalReplicaTicketId(),
                task.getOriginalReplicaTicket() == null ? null : task.getOriginalReplicaTicket().getId())) {
            changes.add("original replica: " + before.originalReplicaTicketLabel() + " -> "
                    + taskLabel(task.getOriginalReplicaTicket()));
        }

        return changes.isEmpty() ? "Ticket updated" : String.join("; ", changes);
    }

    private Specification<Task> projectIdEquals(Long projectId) {
        return (root, query, builder) -> builder.equal(root.get("project").get("id"), projectId);
    }

    private Specification<Task> projectIdIn(List<Long> projectIds) {
        return (root, query, builder) -> root.get("project").get("id").in(projectIds);
    }

    private Specification<Task> taskIdNotEquals(Long taskId) {
        return (root, query, builder) -> builder.notEqual(root.get("id"), taskId);
    }

    private Specification<Task> statusEquals(TaskStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, builder) -> builder.equal(root.get("status"), status);
    }

    private Specification<Task> assigneeEquals(Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }
        return (root, query, builder) -> builder.equal(root.get("assignee").get("id"), assigneeId);
    }

    private Specification<Task> searchMatches(String search) {
        if (search == null) {
            return null;
        }
        return (root, query, builder) -> {
            String likeValue = "%" + search.toLowerCase() + "%";
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.like(builder.lower(root.get("title")), likeValue));
            predicates.add(builder.like(builder.lower(root.get("ticketNumber")), likeValue));
            predicates.add(builder.like(builder.lower(root.get("description")), likeValue));
            return builder.or(predicates.toArray(Predicate[]::new));
        };
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim();
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String formatTicketNumber(Long taskId) {
        return "TKT-" + (taskId + 100);
    }

    private String valueOrNone(Object value) {
        return value == null ? "None" : value.toString();
    }

    private String userLabel(User user) {
        return user == null ? "Unassigned" : user.getFullName();
    }

    private String taskLabel(Task task) {
        return task == null ? "None" : task.getTicketNumber();
    }

    private record TaskSnapshot(
            String title,
            String description,
            TaskStatus status,
            TaskPriority priority,
            LocalDate dueDate,
            Long assigneeId,
            String assigneeLabel,
            Long linkedTicketId,
            String linkedTicketLabel,
            Long originalReplicaTicketId,
            String originalReplicaTicketLabel) {

        private static TaskSnapshot from(Task task) {
            return new TaskSnapshot(
                    task.getTitle(),
                    task.getDescription(),
                    task.getStatus(),
                    task.getPriority(),
                    task.getDueDate(),
                    task.getAssignee() == null ? null : task.getAssignee().getId(),
                    task.getAssignee() == null ? "Unassigned" : task.getAssignee().getFullName(),
                    task.getLinkedTicket() == null ? null : task.getLinkedTicket().getId(),
                    task.getLinkedTicket() == null ? "None" : task.getLinkedTicket().getTicketNumber(),
                    task.getOriginalReplicaTicket() == null ? null : task.getOriginalReplicaTicket().getId(),
                    task.getOriginalReplicaTicket() == null
                            ? "None"
                            : task.getOriginalReplicaTicket().getTicketNumber());
        }
    }
}
