package com.example.demo.authorization.exception;

import com.example.demo.common.exception.ForbiddenOperationException;

public class AccessDeniedException extends ForbiddenOperationException {

    public AccessDeniedException(String message) {
        super(message);
    }
}
