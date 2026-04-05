package com.example.demo.comment.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.comment.entity.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = { "task", "author", "author.role" })
    List<Comment> findAllByTaskId(Long taskId, Sort sort);
}
