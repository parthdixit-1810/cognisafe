package com.example.passwordvault.controller;

import org.springframework.web.bind.annotation.*;

@RestController
public class HealthController {

    @GetMapping("/")
    public String health() {
        return "CogniSafe Password Vault API is running!";
    }

    @GetMapping("/health")
    public String healthCheck() {
        return "OK";
    }
} 