package com.example.demo.task.dto;

public record DuplicateTicketCheckResponse(
        boolean analysisAvailable,
        boolean duplicateFound,
        String warningMessage,
        Double similarityScore,
        Double similarityThreshold,
        TaskReferenceDto matchedTicket) {
}
