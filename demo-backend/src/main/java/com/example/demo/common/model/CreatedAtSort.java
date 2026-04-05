package com.example.demo.common.model;

import org.springframework.data.domain.Sort;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CreatedAtSort {
    NEWEST,
    OLDEST;

    @JsonCreator
    public static CreatedAtSort from(String value) {
        if (value == null || value.isBlank()) {
            return NEWEST;
        }

        String normalized = value.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase();

        return switch (normalized) {
            case "NEWEST", "DESC", "DESCENDING" -> NEWEST;
            case "OLDEST", "ASC", "ASCENDING" -> OLDEST;
            default -> throw new IllegalArgumentException("Unsupported sort value: " + value);
        };
    }

    @JsonValue
    public String getValue() {
        return name();
    }

    public Sort toSort() {
        return Sort.by(this == NEWEST ? Sort.Direction.DESC : Sort.Direction.ASC, "createdAt");
    }
}
