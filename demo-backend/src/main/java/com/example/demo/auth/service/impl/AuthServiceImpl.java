package com.example.demo.auth.service.impl;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.dto.ForgotPasswordRequest;
import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.ResetPasswordRequest;
import com.example.demo.auth.dto.SignupRequest;
import com.example.demo.auth.dto.VerifyOtpRequest;
import com.example.demo.auth.entity.PasswordResetToken;
import com.example.demo.auth.exception.InvalidCredentialsException;
import com.example.demo.auth.exception.OtpExpiredException;
import com.example.demo.auth.exception.OtpInvalidException;
import com.example.demo.auth.repository.PasswordResetTokenRepository;
import com.example.demo.auth.security.JwtService;
import com.example.demo.auth.service.AuthService;
import com.example.demo.auth.service.EmailService;
import com.example.demo.auth.service.OtpService;
import com.example.demo.auth.service.PasswordResetService;
import com.example.demo.common.security.UserPrincipal;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.role.entity.Role;
import com.example.demo.role.entity.RoleName;
import com.example.demo.role.repository.RoleRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.exception.EmailAlreadyExistsException;
import com.example.demo.user.exception.UserNotFoundException;
import com.example.demo.user.repository.UserRepository;

@Service
@Transactional
public class AuthServiceImpl implements AuthService, PasswordResetService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailService emailService;

    public AuthServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            OtpService otpService,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.emailService = emailService;
    }

    @Override
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        Role defaultRole = roleRepository.findByName(RoleName.USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.USER)));

        User user = new User(
                request.fullName().trim(),
                request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()),
                defaultRole);

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(new UserPrincipal(savedUser));
        return new AuthResponse(token, DtoMapper.toUserSummary(savedUser));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    request.email().trim().toLowerCase(),
                    request.password()));
        } catch (Exception exception) {
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        String token = jwtService.generateToken(new UserPrincipal(user));
        return new AuthResponse(token, DtoMapper.toUserSummary(user));
    }

    @Override
    public void sendPasswordResetOtp(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.email()));

        passwordResetTokenRepository.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(user.getEmail())
                .ifPresent(existingToken -> existingToken.setUsed(true));

        String otp = otpService.generateOtp();
        PasswordResetToken passwordResetToken = new PasswordResetToken(
                user,
                otp,
                Instant.now().plus(5, ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(passwordResetToken);
        emailService.sendPasswordResetOtp(user.getEmail(), otp);
    }

    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        PasswordResetToken token = passwordResetTokenRepository
                .findTopByUserEmailIgnoreCaseAndOtpAndUsedFalseOrderByCreatedAtDesc(
                        request.email().trim().toLowerCase(),
                        request.otp())
                .orElseThrow(OtpInvalidException::new);

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new OtpExpiredException();
        }
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository
                .findTopByUserEmailIgnoreCaseAndOtpAndUsedFalseOrderByCreatedAtDesc(
                        request.email().trim().toLowerCase(),
                        request.otp())
                .orElseThrow(OtpInvalidException::new);

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new OtpExpiredException();
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        token.setUsed(true);
        userRepository.save(user);
        passwordResetTokenRepository.save(token);
    }
}
