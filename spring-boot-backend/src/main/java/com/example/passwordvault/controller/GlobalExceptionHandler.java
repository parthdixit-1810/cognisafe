package com.example.passwordvault.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Request failed";
        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (msg.toLowerCase().contains("invalid credentials") || msg.toLowerCase().contains("invalid or expired otp")) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (msg.toLowerCase().contains("forbidden")) {
            status = HttpStatus.FORBIDDEN;
        } else if (msg.toLowerCase().contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        }
        return ResponseEntity.status(status).body(Map.of("error", msg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Internal server error";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", msg));
    }
}
