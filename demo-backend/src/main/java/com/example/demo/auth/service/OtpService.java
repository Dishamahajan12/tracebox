package com.example.demo.auth.service;

import java.security.SecureRandom;

import org.springframework.stereotype.Service;

@Service
public class OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public String generateOtp() {
        int otp = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }
}
