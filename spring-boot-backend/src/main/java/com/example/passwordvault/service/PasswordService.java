package com.example.passwordvault.service;

import com.example.passwordvault.model.PasswordEntry;
import com.example.passwordvault.repository.PasswordEntryRepository;
import com.example.passwordvault.util.PasswordUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PasswordService {
    @Autowired
    private PasswordEntryRepository passwordEntryRepository;

    public List<PasswordEntry> getAll(Long userId) {
        return passwordEntryRepository.findByUserId(userId);
    }

    public PasswordEntry add(Long userId, String site, String username, String password) {
        String salt = PasswordUtil.generateSalt();
        String hash = PasswordUtil.hashPassword(password, salt);
        PasswordEntry entry = new PasswordEntry(null, userId, site, username, hash, salt);
        return passwordEntryRepository.save(entry);
    }

    public boolean update(Long userId, Long id, String site, String username, String password) {
        Optional<PasswordEntry> entryOpt = passwordEntryRepository.findById(id);
        if (entryOpt.isEmpty()) return false;
        PasswordEntry entry = entryOpt.get();
        if (!entry.getUserId().equals(userId)) return false;
        entry.setSite(site);
        entry.setUsername(username);
        String salt = PasswordUtil.generateSalt();
        entry.setSalt(salt);
        entry.setPasswordHash(PasswordUtil.hashPassword(password, salt));
        passwordEntryRepository.save(entry);
        return true;
    }

    public boolean delete(Long userId, Long id) {
        Optional<PasswordEntry> entryOpt = passwordEntryRepository.findById(id);
        if (entryOpt.isEmpty()) return false;
        PasswordEntry entry = entryOpt.get();
        if (!entry.getUserId().equals(userId)) return false;
        passwordEntryRepository.delete(entry);
        return true;
    }
} 