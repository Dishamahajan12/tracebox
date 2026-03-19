package com.example.demo.common.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenOperationException extends AppException {

    public ForbiddenOperationException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
