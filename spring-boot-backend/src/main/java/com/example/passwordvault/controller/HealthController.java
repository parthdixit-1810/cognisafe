package com.example.passwordvault.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("CogniSafe Password Vault API is running!");
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/api/health")
    public ResponseEntity<String> apiHealth() {
        return ResponseEntity.ok("API is healthy");
    }
} 