package com.example.demo.auth.service;

import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.demo.common.exception.BadRequestException;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetOtp(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("TraceBox password reset OTP");
            message.setText("Your OTP is: " + otp + "\n\nThis OTP is valid for 5 minutes.");
            mailSender.send(message);
        } catch (MailException exception) {
            throw new BadRequestException("Failed to send OTP email");
        }
    }
}
