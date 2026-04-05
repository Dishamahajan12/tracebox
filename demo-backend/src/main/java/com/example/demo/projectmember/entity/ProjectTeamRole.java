package com.example.demo.projectmember.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ProjectTeamRole {
    TESTER,
    MANAGER,
    DEVELOPER,
    DEVOPS,
    SENIOR_MANAGER;

    @JsonCreator
    public static ProjectTeamRole fromValue(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase();

        return switch (normalized) {
            case "TESTER" -> TESTER;
            case "MANAGER" -> MANAGER;
            case "DEVELOPER" -> DEVELOPER;
            case "DEVOPS" -> DEVOPS;
            case "SENIOR_MANAGER" -> SENIOR_MANAGER;
            default -> throw new IllegalArgumentException("Unsupported project role: " + value);
        };
    }

    public static ProjectTeamRole defaultForAccessRole(ProjectRole accessRole) {
        return switch (accessRole) {
            case PROJECT_OWNER -> SENIOR_MANAGER;
            case PROJECT_ADMIN -> MANAGER;
            case MEMBER -> DEVELOPER;
            case VIEWER -> TESTER;
        };
    }

    @JsonValue
    public String getValue() {
        return name();
    }
}
