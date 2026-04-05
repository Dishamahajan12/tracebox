package com.example.demo.report.service;

import java.util.List;

import com.example.demo.report.dto.CreateProjectReportRequest;
import com.example.demo.report.dto.ProjectReportResponse;

public interface ProjectReportService {

    ProjectReportResponse createProjectReport(Long projectId, CreateProjectReportRequest request);

    List<ProjectReportResponse> getProjectReports(Long projectId, String search, String sort);

    ProjectReportResponse getProjectReport(Long reportId);

    ProjectReportResponse updateProjectReport(Long reportId, CreateProjectReportRequest request);
}
