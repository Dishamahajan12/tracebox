package com.example.demo.user.exception;

import com.example.demo.common.exception.ConflictException;

public class EmailAlreadyExistsException extends ConflictException {

    public EmailAlreadyExistsException(String email) {
        super("Email already exists: " + email);
    }
}
