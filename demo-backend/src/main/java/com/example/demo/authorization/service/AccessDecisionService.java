package com.example.demo.authorization.service;

public interface AccessDecisionService {

    void requireCommentModificationAccess(Long projectId, Long actorUserId, Long authorUserId);
}
