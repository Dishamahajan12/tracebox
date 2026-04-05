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
import com.example.demo.common.model.CreatedAtSort;
import com.example.demo.common.security.SecurityUtils;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.projectmember.entity.ProjectRole;
import com.example.demo.task.entity.Task;
import com.example.demo.task.service.TaskHistoryRecorder;
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
    private final TaskHistoryRecorder taskHistoryRecorder;

    public CommentServiceImpl(
            CommentRepository commentRepository,
            TaskService taskService,
            UserService userService,
            ProjectAuthorizationService projectAuthorizationService,
            AccessDecisionService accessDecisionService,
            TaskHistoryRecorder taskHistoryRecorder) {
        this.commentRepository = commentRepository;
        this.taskService = taskService;
        this.userService = userService;
        this.projectAuthorizationService = projectAuthorizationService;
        this.accessDecisionService = accessDecisionService;
        this.taskHistoryRecorder = taskHistoryRecorder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getTaskComments(Long taskId, String sort) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = taskService.getRequiredTask(taskId);
        projectAuthorizationService.requireProjectRole(task.getProject().getId(), currentUserId, ProjectRole.VIEWER);
        return commentRepository.findAllByTaskId(taskId, CreatedAtSort.from(sort).toSort()).stream()
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
        Comment savedComment = commentRepository.save(comment);
        taskHistoryRecorder.record(task, author, "COMMENT_ADDED", "Comment added to ticket");
        return DtoMapper.toCommentResponse(savedComment);
    }

    @Override
    public CommentResponse updateComment(Long commentId, UpdateCommentRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Comment comment = getRequiredComment(commentId);
        Long projectId = comment.getTask().getProject().getId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);
        accessDecisionService.requireCommentModificationAccess(projectId, currentUserId, comment.getAuthor().getId());

        comment.setContent(request.content().trim());
        Comment savedComment = commentRepository.save(comment);
        taskHistoryRecorder.record(
                comment.getTask(),
                userService.getRequiredUser(currentUserId),
                "COMMENT_UPDATED",
                "Comment updated");
        return DtoMapper.toCommentResponse(savedComment);
    }

    @Override
    public void deleteComment(Long commentId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Comment comment = getRequiredComment(commentId);
        Long projectId = comment.getTask().getProject().getId();
        projectAuthorizationService.requireProjectRole(projectId, currentUserId, ProjectRole.MEMBER);
        accessDecisionService.requireCommentModificationAccess(projectId, currentUserId, comment.getAuthor().getId());
        taskHistoryRecorder.record(
                comment.getTask(),
                userService.getRequiredUser(currentUserId),
                "COMMENT_DELETED",
                "Comment deleted");
        commentRepository.delete(comment);
    }

    private Comment getRequiredComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));
    }
}
