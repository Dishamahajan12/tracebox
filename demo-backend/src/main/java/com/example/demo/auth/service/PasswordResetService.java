package com.example.demo.auth.service;

import com.example.demo.auth.dto.ForgotPasswordRequest;
import com.example.demo.auth.dto.ResetPasswordRequest;
import com.example.demo.auth.dto.VerifyOtpRequest;

public interface PasswordResetService {

    void sendPasswordResetOtp(ForgotPasswordRequest request);

    void verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);
}
