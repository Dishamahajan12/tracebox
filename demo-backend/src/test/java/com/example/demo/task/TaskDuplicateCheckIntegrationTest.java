package com.example.demo.task;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.example.demo.task.service.TaskDuplicateDetectionResult;
import com.example.demo.task.service.TaskDuplicateDetector;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskDuplicateCheckIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TaskDuplicateDetector taskDuplicateDetector;

    @Test
    void duplicateCheckShouldReturnWarningForMatchedTicket() throws Exception {
        String token = signupAndGetToken("tracebox-duplicate-check-" + System.nanoTime() + "@example.com");
        Long projectId = createProject(token);
        CreatedTicket existingTicket = createTicket(
                token,
                projectId,
                "Login button fails on portal",
                "Users cannot sign in after clicking the login button.");

        when(taskDuplicateDetector.findBestMatch(any(), anyList()))
                .thenReturn(new TaskDuplicateDetectionResult(true, existingTicket.id(), 0.9134));

        mockMvc.perform(post("/api/projects/{projectId}/tickets/duplicate-check", projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Unable to login to customer portal",
                                  "description": "Users are blocked during sign in after clicking login."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysisAvailable").value(true))
                .andExpect(jsonPath("$.data.duplicateFound").value(true))
                .andExpect(jsonPath("$.data.matchedTicket.id").value(existingTicket.id()))
                .andExpect(jsonPath("$.data.matchedTicket.ticketNumber").value(existingTicket.ticketNumber()))
                .andExpect(jsonPath("$.data.warningMessage").value(containsString(existingTicket.ticketNumber())))
                .andExpect(jsonPath("$.data.similarityScore").value(0.913))
                .andExpect(jsonPath("$.data.similarityThreshold").value(0.78));
    }

    @Test
    void duplicateCheckShouldWarnForExactDescriptionMatchEvenWithoutAiMatch() throws Exception {
        String token = signupAndGetToken("tracebox-duplicate-description-" + System.nanoTime() + "@example.com");
        Long projectId = createProject(token);
        CreatedTicket existingTicket = createTicket(
                token,
                projectId,
                "TEST TKT",
                "dfsgss");

        mockMvc.perform(post("/api/projects/{projectId}/tickets/duplicate-check", projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Tkt",
                                  "description": "dfsgss"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysisAvailable").value(true))
                .andExpect(jsonPath("$.data.duplicateFound").value(true))
                .andExpect(jsonPath("$.data.matchedTicket.id").value(existingTicket.id()))
                .andExpect(jsonPath("$.data.matchedTicket.ticketNumber").value(existingTicket.ticketNumber()))
                .andExpect(jsonPath("$.data.similarityScore").value(1.0));

        verifyNoInteractions(taskDuplicateDetector);
    }

    @Test
    void duplicateCheckShouldWarnForLexicalTitleMatch() throws Exception {
        String token = signupAndGetToken("tracebox-duplicate-title-" + System.nanoTime() + "@example.com");
        Long projectId = createProject(token);
        CreatedTicket existingTicket = createTicket(
                token,
                projectId,
                "Login issue",
                "User is facing issue while logging in in the system");

        mockMvc.perform(post("/api/projects/{projectId}/tickets/duplicate-check", projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "issue while logging in",
                                  "description": "Unable to login"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysisAvailable").value(true))
                .andExpect(jsonPath("$.data.duplicateFound").value(true))
                .andExpect(jsonPath("$.data.matchedTicket.id").value(existingTicket.id()))
                .andExpect(jsonPath("$.data.matchedTicket.ticketNumber").value(existingTicket.ticketNumber()));

        verifyNoInteractions(taskDuplicateDetector);
    }

    private String signupAndGetToken(String email) throws Exception {
        MvcResult signupResult = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "TraceBox Duplicate Test User",
                                  "email": "%s",
                                  "password": "password123"
                                }
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode responseBody = objectMapper.readTree(signupResult.getResponse().getContentAsString());
        return responseBody.path("token").asText();
    }

    private Long createProject(String token) throws Exception {
        String projectKey = ("DP" + System.nanoTime()).substring(0, 12).toUpperCase();

        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Duplicate Check Project",
                                  "projectKey": "%s",
                                  "description": "Project for duplicate ticket checks"
                                }
                                """.formatted(projectKey)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data")
                .path("id")
                .asLong();
    }

    private CreatedTicket createTicket(String token, Long projectId, String title, String description) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects/{projectId}/tickets", projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "%s",
                                  "description": "%s",
                                  "priority": "HIGH"
                                }
                                """.formatted(title, description)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode responseBody = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        return new CreatedTicket(
                responseBody.path("id").asLong(),
                responseBody.path("ticketNumber").asText());
    }

    private record CreatedTicket(Long id, String ticketNumber) {
    }
}
