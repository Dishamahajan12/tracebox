package com.example.demo.auth.exception;

import org.springframework.http.HttpStatus;

import com.example.demo.common.exception.AppException;

public class InvalidCredentialsException extends AppException {

    public InvalidCredentialsException() {
        super(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}
