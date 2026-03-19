package com.example.demo.comment.service;

import java.util.List;

import com.example.demo.comment.dto.CommentResponse;
import com.example.demo.comment.dto.CreateCommentRequest;
import com.example.demo.comment.dto.UpdateCommentRequest;

public interface CommentService {

    List<CommentResponse> getTaskComments(Long taskId);

    CommentResponse addComment(Long taskId, CreateCommentRequest request);

    CommentResponse updateComment(Long commentId, UpdateCommentRequest request);

    void deleteComment(Long commentId);
}
