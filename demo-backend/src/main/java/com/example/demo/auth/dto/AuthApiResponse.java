package com.example.demo.auth.dto;

import com.example.demo.user.dto.UserSummaryDto;

public record AuthApiResponse(
        boolean success,
        String message,
        AuthResponse data,
        String token,
        UserSummaryDto user) {

    public static AuthApiResponse success(String message, AuthResponse data) {
        return new AuthApiResponse(
                true,
                message,
                data,
                data.token(),
                data.user());
    }
}
