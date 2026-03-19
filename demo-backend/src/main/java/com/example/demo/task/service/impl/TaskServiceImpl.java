package com.example.demo.task.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.authorization.service.ProjectAuthorizationService;
import com.example.demo.common.exception.BadRequestException;
import com.example.demo.common.security.SecurityUtils;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.project.entity.Project;
import com.example.demo.project.service.ProjectService;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.projectmember.repository.ProjectMemberRepository;
import com.example.demo.task.dto.CreateTaskRequest;
import com.example.demo.task.dto.TaskResponse;
import com.example.demo.task.dto.UpdateTaskRequest;
import com.example.demo.task.entity.Task;
import com.example.demo.task.entity.TaskStatus;
import com.example.demo.task.exception.TaskNotFoundException;
import com.example.demo.task.repository.TaskRepository;
import com.example.demo.task.service.TaskService;
import com.example.demo.user.entity.User;
import com.example.demo.user.service.UserService;

@Service
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectService projectService;
    private final UserService userService;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectAuthorizationService projectAuthorizationService;

    public TaskServiceImpl(
            TaskRepository taskRepository,
            ProjectService projectService,
            UserService userService,
            ProjectMemberRepository projectMemberRepository,
            ProjectAuthorizationService projectAuthorizationService) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
        this.userService = userService;
        this.projectMemberRepository = projectMemberRepository;
        this.projectAuthorizationService = projectAuthorizationService;
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
        task.setTitle(request.title().trim());
        task.setDescription(request.description() == null ? null : request.description().trim());
        task.setPriority(request.priority());
        task.setStatus(request.status() == null ? TaskStatus.TODO : request.status());
        task.setDueDate(request.dueDate());
        task.setAssignee(resolveAssignee(projectId, request.assigneeId()));

        return DtoMapper.toTaskResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getProjectTasks(Long projectId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.VIEWER);
        return taskRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(DtoMapper::toTaskResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long taskId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = getRequiredTask(taskId);
        projectAuthorizationService.requireProjectRole(task.getProject().getId(), currentUserId, ProjectRole.VIEWER);
        return DtoMapper.toTaskResponse(task);
    }

    @Override
    public TaskResponse updateTask(Long taskId, UpdateTaskRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = getRequiredTask(taskId);
        Long projectId = task.getProject().getId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);

        task.setTitle(request.title().trim());
        task.setDescription(request.description() == null ? null : request.description().trim());
        task.setStatus(request.status());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        task.setAssignee(resolveAssignee(projectId, request.assigneeId()));

        return DtoMapper.toTaskResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public Task getRequiredTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
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
}
