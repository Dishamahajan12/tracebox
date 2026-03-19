package com.example.demo.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.auth.dto.AuthApiResponse;
import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.dto.ForgotPasswordRequest;
import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.ResetPasswordRequest;
import com.example.demo.auth.dto.SignupRequest;
import com.example.demo.auth.dto.VerifyOtpRequest;
import com.example.demo.auth.service.AuthService;
import com.example.demo.auth.service.PasswordResetService;
import com.example.demo.common.response.ApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthApiResponse> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse authResponse = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authResponse.token())
                .body(AuthApiResponse.success("Signup successful", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthApiResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authResponse.token())
                .body(AuthApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.sendPasswordResetOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        passwordResetService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully"));
    }
}
