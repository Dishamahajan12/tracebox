package com.example.demo.task.service;

public record TaskDuplicateDetectionResult(
        boolean analysisAvailable,
        Long matchedTaskId,
        Double similarityScore) {

    public static TaskDuplicateDetectionResult unavailable() {
        return new TaskDuplicateDetectionResult(false, null, null);
    }

    public static TaskDuplicateDetectionResult noMatch() {
        return new TaskDuplicateDetectionResult(true, null, null);
    }
}
