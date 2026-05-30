package com.example.passwordvault.controller;

import com.example.passwordvault.model.User;
import com.example.passwordvault.security.JwtAuthInterceptor;
import com.example.passwordvault.security.JwtService;
import com.example.passwordvault.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody Map<String, String> body) {
        User user = userService.signup(
                body.get("email"),
                body.get("password"),
                body.getOrDefault("name", ""),
                body.getOrDefault("phone", ""));
        String token = jwtService.createToken(user.getId(), user.getEmail());
        Map<String, Object> res = new HashMap<>();
        res.put("token", token);
        res.put("userId", user.getId());
        res.put("email", user.getEmail());
        return res;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        User user = userService.login(body.get("email"), body.get("password"));
        if (user == null) throw new RuntimeException("Invalid credentials");

        Map<String, Object> res = new HashMap<>();
        if (user.isTwoFactorEnabled()) {
            userService.setOtpForUser(user);
            res.put("twoFactorRequired", true);
            res.put("userId", user.getId());
            res.put("email", user.getEmail());
            return res;
        }

        res.put("twoFactorRequired", false);
        res.put("token", jwtService.createToken(user.getId(), user.getEmail()));
        res.put("email", user.getEmail());
        return res;
    }

    @PostMapping("/verify-2fa")
    public Map<String, Object> verify2fa(@RequestBody Map<String, String> body) {
        Long userId = Long.valueOf(body.get("userId"));
        String code = body.get("code");
        User user = userService.getById(userId);
        if (user == null) throw new RuntimeException("User not found");
        if (!userService.verifyOtp(user, code)) throw new RuntimeException("Invalid or expired OTP");

        return Map.of(
                "token", jwtService.createToken(user.getId(), user.getEmail()),
                "email", user.getEmail(),
                "userId", user.getId());
    }

    @PostMapping("/resend-otp")
    public Map<String, String> resendOtp(@RequestBody Map<String, String> body) {
        Long userId = Long.valueOf(body.get("userId"));
        User user = userService.getById(userId);
        if (user == null) throw new RuntimeException("User not found");
        if (!user.isTwoFactorEnabled()) throw new RuntimeException("2FA is not enabled for this account");
        userService.setOtpForUser(user);
        return Map.of("message", "Code sent");
    }

    @GetMapping("/me")
    public Map<String, Object> me(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute(JwtAuthInterceptor.USER_ID_ATTR);
        User user = userService.getById(userId);
        if (user == null) throw new RuntimeException("User not found");
        return Map.of(
                "user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "twoFactorEnabled", user.isTwoFactorEnabled(),
                        "name", user.getName() != null ? user.getName() : ""));
    }

    @PostMapping("/2fa")
    public Map<String, Object> toggle2fa(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Long userId = (Long) request.getAttribute(JwtAuthInterceptor.USER_ID_ATTR);
        boolean enable = Boolean.TRUE.equals(body.get("enable"));
        User user = userService.toggle2fa(userId, enable);
        return Map.of("twoFactorEnabled", user.isTwoFactorEnabled());
    }
}
