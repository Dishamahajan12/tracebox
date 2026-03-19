package com.example.demo.admin.service;

import java.util.List;

import com.example.demo.admin.dto.AdminDashboardResponse;
import com.example.demo.admin.dto.AdminUserUpdateRequest;
import com.example.demo.user.dto.UserResponse;

public interface AdminService {

    AdminDashboardResponse getDashboard();

    List<UserResponse> getUsers();

    UserResponse updateUser(Long userId, AdminUserUpdateRequest request);
}
