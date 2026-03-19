package com.example.demo.comment.exception;

import com.example.demo.common.exception.ResourceNotFoundException;

public class CommentNotFoundException extends ResourceNotFoundException {

    public CommentNotFoundException(Long commentId) {
        super("Comment not found with id: " + commentId);
    }
}
