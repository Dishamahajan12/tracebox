package com.example.demo.comment.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.authorization.service.AccessDecisionService;
import com.example.demo.authorization.service.ProjectAuthorizationService;
import com.example.demo.comment.dto.CommentResponse;
import com.example.demo.comment.dto.CreateCommentRequest;
import com.example.demo.comment.dto.UpdateCommentRequest;
import com.example.demo.comment.entity.Comment;
import com.example.demo.comment.exception.CommentNotFoundException;
import com.example.demo.comment.repository.CommentRepository;
import com.example.demo.comment.service.CommentService;
import com.example.demo.common.security.SecurityUtils;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.task.entity.Task;
import com.example.demo.task.service.TaskService;
import com.example.demo.user.entity.User;
import com.example.demo.user.service.UserService;

@Service
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TaskService taskService;
    private final UserService userService;
    private final ProjectAuthorizationService projectAuthorizationService;
    private final AccessDecisionService accessDecisionService;

    public CommentServiceImpl(
            CommentRepository commentRepository,
            TaskService taskService,
            UserService userService,
            ProjectAuthorizationService projectAuthorizationService,
            AccessDecisionService accessDecisionService) {
        this.commentRepository = commentRepository;
        this.taskService = taskService;
        this.userService = userService;
        this.projectAuthorizationService = projectAuthorizationService;
        this.accessDecisionService = accessDecisionService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getTaskComments(Long taskId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = taskService.getRequiredTask(taskId);
        projectAuthorizationService.requireProjectRole(task.getProject().getId(), currentUserId, ProjectRole.VIEWER);
        return commentRepository.findAllByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(DtoMapper::toCommentResponse)
                .toList();
    }

    @Override
    public CommentResponse addComment(Long taskId, CreateCommentRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = taskService.getRequiredTask(taskId);
        projectAuthorizationService.requireProjectRole(task.getProject().getId(), currentUserId, ProjectRole.MEMBER);

        User author = userService.getRequiredUser(currentUserId);
        Comment comment = new Comment();
        comment.setTask(task);
        comment.setAuthor(author);
        comment.setContent(request.content().trim());
        return DtoMapper.toCommentResponse(commentRepository.save(comment));
    }

    @Override
    public CommentResponse updateComment(Long commentId, UpdateCommentRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Comment comment = getRequiredComment(commentId);
        Long projectId = comment.getTask().getProject().getId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);
        accessDecisionService.requireCommentModificationAccess(projectId, currentUserId, comment.getAuthor().getId());

        comment.setContent(request.content().trim());
        return DtoMapper.toCommentResponse(commentRepository.save(comment));
    }

    @Override
    public void deleteComment(Long commentId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Comment comment = getRequiredComment(commentId);
        Long projectId = comment.getTask().getProject().getId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);
        accessDecisionService.requireCommentModificationAccess(projectId, currentUserId, comment.getAuthor().getId());
        commentRepository.delete(comment);
    }

    private Comment getRequiredComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));
    }
}
