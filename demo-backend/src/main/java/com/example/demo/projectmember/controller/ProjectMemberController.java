package com.example.demo.projectmember.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.projectmember.dto.AddProjectMemberRequest;
import com.example.demo.projectmember.dto.ProjectMemberResponse;
import com.example.demo.projectmember.dto.UpdateProjectMemberRoleRequest;
import com.example.demo.projectmember.service.ProjectMemberService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects/{projectId}/members")
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    public ProjectMemberController(ProjectMemberService projectMemberService) {
        this.projectMemberService = projectMemberService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectMemberResponse>>> getProjectMembers(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Project members fetched successfully",
                projectMemberService.getProjectMembers(projectId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> addProjectMember(
            @PathVariable Long projectId,
            @Valid @RequestBody AddProjectMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Project member added successfully",
                        projectMemberService.addProjectMember(projectId, request)));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> updateProjectMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateProjectMemberRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Project member role updated successfully",
                projectMemberService.updateProjectMemberRole(projectId, userId, request)));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeProjectMember(
            @PathVariable Long projectId,
            @PathVariable Long userId) {
        projectMemberService.removeProjectMember(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success("Project member removed successfully"));
    }
}
