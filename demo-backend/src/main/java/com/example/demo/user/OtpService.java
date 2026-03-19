package com.example.demo.user;

import java.util.Random;

import org.springframework.stereotype.Service;

@Service
public class OtpService {

    public String generateOtp() {

        Random random = new Random();

        int otp = 100000 + random.nextInt(900000);

        return String.valueOf(otp);
    }
}