package com.example.demo.task.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TaskStatus {
    NEW("NEW"),
    IN_PROGRESS("IN_PROGRESS"),
    IN_REVIEW("IN_REVIEW"),
    COMPLETED("COMPLETED");

    private final String value;

    TaskStatus(String value) {
        this.value = value;
    }

    @JsonCreator
    public static TaskStatus fromValue(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase();

        return switch (normalized) {
            case "TODO", "NEW" -> NEW;
            case "IN_PROGRESS" -> IN_PROGRESS;
            case "IN_REVIEW" -> IN_REVIEW;
            case "DONE", "COMPLETED" -> COMPLETED;
            default -> throw new IllegalArgumentException("Unsupported ticket status: " + value);
        };
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
