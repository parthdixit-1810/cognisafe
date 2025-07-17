package com.example.passwordvault.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;

@Entity
@Table(name = "user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String email;
    @Column(name = "password_hash")
    private String passwordHash;
    private String salt;
    @Column(name = "two_factor_enabled")
    private boolean twoFactorEnabled = false;
    @Column(name = "two_factor_temp_code")
    private String twoFactorTempCode;
    @Column(name = "two_factor_temp_expires")
    private java.time.LocalDateTime twoFactorTempExpires;
    @Column(name = "name")
    private String name;
    @Column(name = "phone")
    private String phone;

    public User() {}

    public User(Long id, String email, String passwordHash, String salt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.salt = salt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }
    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }
    public String getTwoFactorTempCode() { return twoFactorTempCode; }
    public void setTwoFactorTempCode(String twoFactorTempCode) { this.twoFactorTempCode = twoFactorTempCode; }
    public java.time.LocalDateTime getTwoFactorTempExpires() { return twoFactorTempExpires; }
    public void setTwoFactorTempExpires(java.time.LocalDateTime twoFactorTempExpires) { this.twoFactorTempExpires = twoFactorTempExpires; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
} 