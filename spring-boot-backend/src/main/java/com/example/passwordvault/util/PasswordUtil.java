package com.example.passwordvault.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

public final class PasswordUtil {
    private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder(12);

    private PasswordUtil() {}

    public static String hashMasterPassword(String password) {
        return BCRYPT.encode(password);
    }

    public static boolean verifyMasterPassword(String password, String bcryptHash) {
        if (bcryptHash == null) return false;
        if (bcryptHash.startsWith("$2a$") || bcryptHash.startsWith("$2b$")) {
            return BCRYPT.matches(password, bcryptHash);
        }
        return false;
    }

    /** Legacy SHA-256 verification for accounts created before bcrypt migration. */
    public static boolean verifyLegacySha256(String password, String salt, String hash) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt.getBytes(StandardCharsets.UTF_8));
            byte[] hashed = md.digest(password.getBytes(StandardCharsets.UTF_8));
            String computed = Base64.getEncoder().encodeToString(hashed);
            return computed.equals(hash);
        } catch (Exception e) {
            return false;
        }
    }

    public static String hashOtp(String otp) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashed = md.digest(otp.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (Exception e) {
            throw new RuntimeException("OTP hashing failed", e);
        }
    }

    public static boolean verifyOtpHash(String otp, String hash) {
        return hashOtp(otp).equals(hash);
    }
}
