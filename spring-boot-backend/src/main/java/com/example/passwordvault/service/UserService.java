package com.example.passwordvault.service;

import com.example.passwordvault.model.User;
import com.example.passwordvault.repository.UserRepository;
import com.example.passwordvault.util.PasswordUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    private static final SecureRandom random = new SecureRandom();
    private static final int MAX_OTP_ATTEMPTS = 5;

    public User signup(String email, String password, String name, String phone) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        User user = new User(null, email, PasswordUtil.hashMasterPassword(password), null);
        user.setName(name != null ? name : "");
        user.setPhone(phone != null ? phone : "");
        user.setTwoFactorEnabled(false);
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return null;
        User user = userOpt.get();
        boolean valid = PasswordUtil.verifyMasterPassword(password, user.getPasswordHash());
        if (!valid && user.getSalt() != null) {
            valid = PasswordUtil.verifyLegacySha256(password, user.getSalt(), user.getPasswordHash());
            if (valid) {
                user.setPasswordHash(PasswordUtil.hashMasterPassword(password));
                user.setSalt(null);
                userRepository.save(user);
            }
        }
        return valid ? user : null;
    }

    public void setOtpForUser(User user) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        user.setTwoFactorTempCode(PasswordUtil.hashOtp(otp));
        user.setTwoFactorTempExpires(LocalDateTime.now().plusMinutes(5));
        user.setOtpAttempts(0);
        userRepository.save(user);
        sendOtpEmail(user.getEmail(), otp);
    }

    public void sendOtpEmail(String to, String otp) {
        if (fromEmail == null || fromEmail.isBlank()) {
            System.out.println("[DEV] OTP for " + to + ": " + otp);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Your CogniSafe verification code");
            helper.setText(
                    "<p>Your verification code is: <strong>" + otp + "</strong></p>"
                            + "<p>It expires in 5 minutes. If you didn't request this, ignore this email.</p>",
                    true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            System.out.println("[FALLBACK] OTP for " + to + ": " + otp);
        }
    }

    public boolean verifyOtp(User user, String otp) {
        if (user.getTwoFactorTempCode() == null || user.getTwoFactorTempExpires() == null) return false;
        if (user.getTwoFactorTempExpires().isBefore(LocalDateTime.now())) return false;
        if (user.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            throw new RuntimeException("Too many attempts. Request a new code.");
        }
        user.setOtpAttempts(user.getOtpAttempts() + 1);
        userRepository.save(user);
        boolean valid = PasswordUtil.verifyOtpHash(otp, user.getTwoFactorTempCode());
        if (valid) {
            user.setTwoFactorTempCode(null);
            user.setTwoFactorTempExpires(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
        }
        return valid;
    }

    public User getById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User toggle2fa(Long userId, boolean enable) {
        User user = getById(userId);
        if (user == null) throw new RuntimeException("User not found");
        user.setTwoFactorEnabled(enable);
        return userRepository.save(user);
    }
}
