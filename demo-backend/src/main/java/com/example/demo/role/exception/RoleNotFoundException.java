package com.example.demo.role.exception;

import com.example.demo.common.exception.ResourceNotFoundException;

public class RoleNotFoundException extends ResourceNotFoundException {

    public RoleNotFoundException(String message) {
        super(message);
    }
}
