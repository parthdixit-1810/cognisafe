package com.example.passwordvault.controller;

import com.example.passwordvault.model.PasswordEntry;
import com.example.passwordvault.service.PasswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/passwords")
public class PasswordController {
    @Autowired
    private PasswordService passwordService;

    @GetMapping
    public List<PasswordEntry> getAll(@RequestParam Long userId) {
        System.out.println("[PasswordController] GET /api/passwords called, userId=" + userId);
        return passwordService.getAll(userId);
    }

    @PostMapping
    public PasswordEntry add(@RequestParam Long userId, @RequestBody Map<String, String> body) {
        System.out.println("[PasswordController] POST /api/passwords called, userId=" + userId + ", body=" + body);
        return passwordService.add(userId, body.get("site"), body.get("username"), body.get("password"));
    }

    @PutMapping("/{id}")
    public boolean update(@RequestParam Long userId, @PathVariable Long id, @RequestBody Map<String, String> body) {
        System.out.println("[PasswordController] PUT /api/passwords/" + id + " called, userId=" + userId + ", body=" + body);
        return passwordService.update(userId, id, body.get("site"), body.get("username"), body.get("password"));
    }

    @DeleteMapping("/{id}")
    public boolean delete(@RequestParam Long userId, @PathVariable Long id) {
        System.out.println("[PasswordController] DELETE /api/passwords/" + id + " called, userId=" + userId);
        return passwordService.delete(userId, id);
    }
} 