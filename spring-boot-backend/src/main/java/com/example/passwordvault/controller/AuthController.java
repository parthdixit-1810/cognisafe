package com.example.passwordvault.controller;

import com.example.passwordvault.model.User;
import com.example.passwordvault.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.time.LocalDateTime;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/signup")
    public Map<String, String> signup(@RequestBody Map<String, String> body) {
        User user = userService.signup(
            body.get("email"),
            body.get("password"),
            body.getOrDefault("name", ""),
            body.getOrDefault("phone", "")
        );
        return Map.of("userId", String.valueOf(user.getId()), "email", user.getEmail());
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        User user = userService.login(body.get("email"), body.get("password"));
        if (user == null) throw new RuntimeException("Invalid credentials");
        // Always require 2FA for all users
        userService.setOtpForUser(user);
        return Map.of("twoFactorRequired", true, "userId", user.getId());
    }

    @PostMapping("/verify-2fa")
    public Map<String, Object> verify2fa(@RequestBody Map<String, String> body) {
        Long userId = Long.valueOf(body.get("userId"));
        String code = body.get("code");
        User user = userService.getById(userId);
        if (user == null) throw new RuntimeException("User not found");
        if (!userService.verifyOtp(user, code)) throw new RuntimeException("Invalid or expired OTP");
        return Map.of("userId", user.getId(), "email", user.getEmail());
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestParam Long userId) {
        User user = userService.getById(userId);
        if (user == null) throw new RuntimeException("User not found");
        return Map.of(
            "user", Map.of(
                "id", user.getId(),
                "email", user.getEmail()
            )
        );
    }
} 