package com.example.passwordvault.controller;

import com.example.passwordvault.dto.VaultEntryDto;
import com.example.passwordvault.security.JwtAuthInterceptor;
import com.example.passwordvault.service.PasswordService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vault")
public class VaultController {
    @Autowired
    private PasswordService passwordService;

    private Long userId(HttpServletRequest request) {
        return (Long) request.getAttribute(JwtAuthInterceptor.USER_ID_ATTR);
    }

    @GetMapping
    public List<VaultEntryDto> list(HttpServletRequest request) {
        return passwordService.getAll(userId(request));
    }

    @PostMapping
    public VaultEntryDto add(HttpServletRequest request, @RequestBody Map<String, String> body) {
        return passwordService.add(
                userId(request),
                body.get("site"),
                body.get("username"),
                body.get("password"),
                body.getOrDefault("url", ""));
    }

    @PutMapping("/{id}")
    public VaultEntryDto update(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return passwordService.update(
                userId(request),
                id,
                body.get("site"),
                body.get("username"),
                body.get("password"),
                body.getOrDefault("url", ""));
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(HttpServletRequest request, @PathVariable Long id) {
        boolean ok = passwordService.delete(userId(request), id);
        if (!ok) throw new RuntimeException("Entry not found");
        return Map.of("ok", true);
    }

    @PostMapping("/import")
    public List<VaultEntryDto> importEntries(
            HttpServletRequest request,
            @RequestBody Map<String, List<Map<String, String>>> body) {
        List<Map<String, String>> entries = body.get("entries");
        if (entries == null || entries.isEmpty()) {
            throw new RuntimeException("No entries to import");
        }
        return passwordService.importEntries(userId(request), entries);
    }

    @GetMapping("/export")
    public List<VaultEntryDto> export(HttpServletRequest request) {
        return passwordService.getAll(userId(request));
    }
}
