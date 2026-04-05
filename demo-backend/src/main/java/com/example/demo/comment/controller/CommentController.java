package com.example.demo.comment.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.comment.dto.CommentResponse;
import com.example.demo.comment.dto.CreateCommentRequest;
import com.example.demo.comment.dto.UpdateCommentRequest;
import com.example.demo.comment.service.CommentService;
import com.example.demo.common.response.ApiResponse;

import jakarta.validation.Valid;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping({ "/api/tasks/{taskId}/comments", "/api/tickets/{taskId}/comments" })
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getTaskComments(
            @PathVariable Long taskId,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(ApiResponse.success(
                "Comments fetched successfully",
                commentService.getTaskComments(taskId, sort)));
    }

    @PostMapping({ "/api/tasks/{taskId}/comments", "/api/tickets/{taskId}/comments" })
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully", commentService.addComment(taskId, request)));
    }

    @PutMapping("/api/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", commentService.updateComment(commentId, request)));
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
    }
}
