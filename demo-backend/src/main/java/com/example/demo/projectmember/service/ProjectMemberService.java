package com.example.demo.projectmember.service;

import java.util.List;

import com.example.demo.projectmember.dto.AddProjectMemberRequest;
import com.example.demo.projectmember.dto.ProjectMemberResponse;
import com.example.demo.projectmember.dto.UpdateProjectMemberRoleRequest;

public interface ProjectMemberService {

    List<ProjectMemberResponse> getProjectMembers(Long projectId);

    ProjectMemberResponse addProjectMember(Long projectId, AddProjectMemberRequest request);

    ProjectMemberResponse updateProjectMemberRole(Long projectId, Long userId, UpdateProjectMemberRoleRequest request);

    void removeProjectMember(Long projectId, Long userId);
}
