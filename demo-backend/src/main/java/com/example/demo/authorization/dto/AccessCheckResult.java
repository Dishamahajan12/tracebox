package com.example.demo.authorization.dto;

public record AccessCheckResult(
        boolean allowed,
        String reason) {
}
