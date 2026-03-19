package com.example.demo.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.auth.entity.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findTopByUserEmailIgnoreCaseAndOtpAndUsedFalseOrderByCreatedAtDesc(String email, String otp);

    Optional<PasswordResetToken> findTopByUserEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(String email);
}
