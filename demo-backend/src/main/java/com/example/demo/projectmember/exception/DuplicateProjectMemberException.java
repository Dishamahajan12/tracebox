package com.example.demo.projectmember.exception;

import com.example.demo.common.exception.ConflictException;

public class DuplicateProjectMemberException extends ConflictException {

    public DuplicateProjectMemberException(Long projectId, Long userId) {
        super("User " + userId + " is already a member of project " + projectId);
    }
}
