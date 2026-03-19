package com.example.demo.user;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    private Map<String, String> otpStorage = new HashMap<>();
    private Map<String, Long> otpTimeStorage = new HashMap<>();

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/signup")
    public User signup(@RequestBody User user) {
        return userRepository.save(user);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();

            if (user.getPasswordHash().equals(loginRequest.getPassword())) {
                return ResponseEntity.ok("Login successful");
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Invalid email or password");
    }

    @PostMapping("/check-email")
    public ResponseEntity<String> checkEmail(@RequestBody Map<String, String> request) {

        String email = request.get("email");

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User does not exist");
        }

        String otp = otpService.generateOtp();
        System.out.println("Generated OTP for " + email + " : " + otp);

        otpStorage.put(email, otp);
        otpTimeStorage.put(email, System.currentTimeMillis());

        emailService.sendOtp(email, otp);

        return ResponseEntity.ok("OTP sent successfully");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody Map<String, String> request) {

        String email = request.get("email");
        String enteredOtp = request.get("otp");

        String storedOtp = otpStorage.get(email);
        Long otpGeneratedTime = otpTimeStorage.get(email);

        if (storedOtp == null || otpGeneratedTime == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("OTP not generated");
        }

        long currentTime = System.currentTimeMillis();
        long otpValidityTime = 60 * 1000; // 1 minute

        if (currentTime - otpGeneratedTime > otpValidityTime) {
            otpStorage.remove(email);
            otpTimeStorage.remove(email);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("OTP expired");
        }

        if (!storedOtp.equals(enteredOtp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid OTP");
        }

        otpStorage.remove(email);
        otpTimeStorage.remove(email);

        return ResponseEntity.ok("OTP verified successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {

        String email = request.get("email");
        String newPassword = request.get("password");

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
        }

        User user = optionalUser.get();

        user.setPasswordHash(newPassword);

        userRepository.save(user);

        return ResponseEntity.ok("Password updated successfully");
    }
}