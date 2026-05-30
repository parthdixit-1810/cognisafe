package com.example.passwordvault.dto;

import java.time.LocalDateTime;

public class VaultEntryDto {
    private Long id;
    private String site;
    private String username;
    private String password;
    private String url;
    private LocalDateTime updatedAt;

    public VaultEntryDto() {}

    public VaultEntryDto(Long id, String site, String username, String password, String url, LocalDateTime updatedAt) {
        this.id = id;
        this.site = site;
        this.username = username;
        this.password = password;
        this.url = url;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
