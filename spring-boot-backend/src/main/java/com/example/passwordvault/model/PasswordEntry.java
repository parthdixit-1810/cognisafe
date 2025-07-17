package com.example.passwordvault.model;

import jakarta.persistence.*;

@Entity
@Table(name = "password")
public class PasswordEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String site;
    private String username;
    @Column(name = "password_hash")
    private String passwordHash;
    private String salt;

    public PasswordEntry() {}

    public PasswordEntry(Long id, Long userId, String site, String username, String passwordHash, String salt) {
        this.id = id;
        this.userId = userId;
        this.site = site;
        this.username = username;
        this.passwordHash = passwordHash;
        this.salt = salt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }
} 