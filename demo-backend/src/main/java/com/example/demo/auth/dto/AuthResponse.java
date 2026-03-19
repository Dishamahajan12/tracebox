package com.example.demo.auth.dto;

import com.example.demo.user.dto.UserSummaryDto;

public record AuthResponse(
        String token,
        UserSummaryDto user) {
}
