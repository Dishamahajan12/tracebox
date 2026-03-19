package com.example.demo.admin.dto;

public record AdminDashboardResponse(
        long totalUsers,
        long activeUsers,
        long totalProjects,
        long totalTasks,
        long totalComments) {
}
