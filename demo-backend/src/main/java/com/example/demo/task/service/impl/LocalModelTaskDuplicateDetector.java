package com.example.demo.task.service.impl;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.example.demo.task.config.TaskDuplicateCheckProperties;
import com.example.demo.task.dto.DuplicateTicketCheckRequest;
import com.example.demo.task.entity.Task;
import com.example.demo.task.service.TaskDuplicateDetectionResult;
import com.example.demo.task.service.TaskDuplicateDetector;

@Service
public class LocalModelTaskDuplicateDetector implements TaskDuplicateDetector {

    private final TaskDuplicateCheckProperties properties;
    private final RestClient restClient;

    public LocalModelTaskDuplicateDetector(
            TaskDuplicateCheckProperties properties,
            RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    @Override
    public TaskDuplicateDetectionResult findBestMatch(DuplicateTicketCheckRequest request, List<Task> candidates) {
        if (!properties.isEnabled()) {
            return TaskDuplicateDetectionResult.unavailable();
        }

        List<SimilarityCandidate> similarityCandidates = candidates.stream()
                .map(task -> new SimilarityCandidate(task.getId(), buildSimilarityText(task.getTitle(), task.getDescription())))
                .toList();

        try {
            SimilarityResponse response = restClient.post()
                    .uri("/api/similarity/duplicate-ticket")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new SimilarityRequest(
                            buildSimilarityText(request.title(), request.description()),
                            similarityCandidates))
                    .retrieve()
                    .body(SimilarityResponse.class);

            if (response == null || response.bestMatchTicketId() == null || response.bestMatchScore() == null) {
                return TaskDuplicateDetectionResult.noMatch();
            }

            return new TaskDuplicateDetectionResult(true, response.bestMatchTicketId(), response.bestMatchScore());
        } catch (RestClientException exception) {
            return TaskDuplicateDetectionResult.unavailable();
        }
    }

    private String buildSimilarityText(String title, String description) {
        String normalizedTitle = title == null ? "" : title.trim();
        String normalizedDescription = description == null ? "" : description.trim();
        if (normalizedDescription.isBlank()) {
            return "Title: " + normalizedTitle + "\nTitle: " + normalizedTitle;
        }
        return "Title: " + normalizedTitle + "\nTitle: " + normalizedTitle + "\nDescription: " + normalizedDescription;
    }

    private record SimilarityRequest(
            String draftText,
            List<SimilarityCandidate> candidates) {
    }

    private record SimilarityCandidate(
            Long ticketId,
            String text) {
    }

    private record SimilarityResponse(
            Long bestMatchTicketId,
            Double bestMatchScore,
            Integer candidateCount) {
    }
}
