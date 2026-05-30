package com.example.passwordvault.config;

import com.example.passwordvault.util.EncryptionUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Configuration
public class EncryptionConfig {
    @Bean
    public SecretKey vaultEncryptionKey(
            @Value("${vault.encryption-key-base64:}") String configured,
            @Value("${jwt.secret:cognisafe-dev-secret-change-in-production-min-32-chars}") String jwtSecret) throws Exception {
        if (configured != null && !configured.isBlank()) {
            return EncryptionUtil.keyFromBase64(configured.trim());
        }
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] derived = md.digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return EncryptionUtil.keyFromBase64(Base64.getEncoder().encodeToString(derived));
    }
}
