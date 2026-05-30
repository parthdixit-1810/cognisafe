package com.example.passwordvault.service;

import com.example.passwordvault.dto.VaultEntryDto;
import com.example.passwordvault.model.PasswordEntry;
import com.example.passwordvault.repository.PasswordEntryRepository;
import com.example.passwordvault.util.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PasswordService {
    @Autowired
    private PasswordEntryRepository passwordEntryRepository;

    @Autowired
    private SecretKey vaultEncryptionKey;

    public List<VaultEntryDto> getAll(Long userId) {
        return passwordEntryRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public VaultEntryDto add(Long userId, String site, String username, String password, String url) {
        String encrypted = EncryptionUtil.encrypt(password, vaultEncryptionKey);
        PasswordEntry entry = new PasswordEntry(null, userId, site, username, encrypted, null);
        entry.setUrl(url);
        return toDto(passwordEntryRepository.save(entry));
    }

    public VaultEntryDto update(Long userId, Long id, String site, String username, String password, String url) {
        PasswordEntry entry = requireOwned(userId, id);
        entry.setSite(site);
        entry.setUsername(username);
        entry.setUrl(url);
        if (password != null && !password.isBlank()) {
            entry.setPasswordHash(EncryptionUtil.encrypt(password, vaultEncryptionKey));
        }
        return toDto(passwordEntryRepository.save(entry));
    }

    public boolean delete(Long userId, Long id) {
        Optional<PasswordEntry> entryOpt = passwordEntryRepository.findById(id);
        if (entryOpt.isEmpty()) return false;
        PasswordEntry entry = entryOpt.get();
        if (!entry.getUserId().equals(userId)) return false;
        passwordEntryRepository.delete(entry);
        return true;
    }

    public List<VaultEntryDto> importEntries(Long userId, List<Map<String, String>> rows) {
        return rows.stream()
                .map(row -> add(
                        userId,
                        row.getOrDefault("site", ""),
                        row.getOrDefault("username", ""),
                        row.getOrDefault("password", ""),
                        row.getOrDefault("url", "")))
                .collect(Collectors.toList());
    }

    private PasswordEntry requireOwned(Long userId, Long id) {
        PasswordEntry entry = passwordEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        if (!entry.getUserId().equals(userId)) {
            throw new RuntimeException("Forbidden");
        }
        return entry;
    }

    private VaultEntryDto toDto(PasswordEntry entry) {
        String plain = decryptSafe(entry.getPasswordHash());
        return new VaultEntryDto(
                entry.getId(),
                entry.getSite(),
                entry.getUsername(),
                plain,
                entry.getUrl(),
                entry.getUpdatedAt());
    }

    private String decryptSafe(String stored) {
        if (stored == null || stored.isBlank()) return "";
        try {
            return EncryptionUtil.decrypt(stored, vaultEncryptionKey);
        } catch (Exception e) {
            return "";
        }
    }
}
