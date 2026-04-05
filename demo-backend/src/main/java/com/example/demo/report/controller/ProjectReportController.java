package com.example.demo.report.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.report.dto.CreateProjectReportRequest;
import com.example.demo.report.dto.ProjectReportResponse;
import com.example.demo.report.service.ProjectReportService;

import jakarta.validation.Valid;

@RestController
public class ProjectReportController {

    private final ProjectReportService projectReportService;

    public ProjectReportController(ProjectReportService projectReportService) {
        this.projectReportService = projectReportService;
    }

    @PostMapping("/api/projects/{projectId}/reports")
    public ResponseEntity<ApiResponse<ProjectReportResponse>> createProjectReport(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateProjectReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Project report created successfully",
                        projectReportService.createProjectReport(projectId, request)));
    }

    @GetMapping("/api/projects/{projectId}/reports")
    public ResponseEntity<ApiResponse<List<ProjectReportResponse>>> getProjectReports(
            @PathVariable Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(ApiResponse.success(
                "Project reports fetched successfully",
                projectReportService.getProjectReports(projectId, search, sort)));
    }

    @GetMapping("/api/reports/{reportId}")
    public ResponseEntity<ApiResponse<ProjectReportResponse>> getProjectReport(@PathVariable Long reportId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Project report fetched successfully",
                projectReportService.getProjectReport(reportId)));
    }

    @PutMapping("/api/reports/{reportId}")
    public ResponseEntity<ApiResponse<ProjectReportResponse>> updateProjectReport(
            @PathVariable Long reportId,
            @Valid @RequestBody CreateProjectReportRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Project report updated successfully",
                projectReportService.updateProjectReport(reportId, request)));
    }
}
