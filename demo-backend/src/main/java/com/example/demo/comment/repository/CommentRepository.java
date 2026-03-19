package com.example.demo.comment.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.comment.entity.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findAllByTaskIdOrderByCreatedAtAsc(Long taskId);
}
