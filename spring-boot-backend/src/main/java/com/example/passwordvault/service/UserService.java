package com.example.passwordvault.service;

import com.example.passwordvault.model.User;
import com.example.passwordvault.repository.UserRepository;
import com.example.passwordvault.util.PasswordUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private static final SecureRandom random = new SecureRandom();

    public User signup(String email, String password, String name, String phone) {
        String salt = PasswordUtil.generateSalt();
        String hash = PasswordUtil.hashPassword(password, salt);
        User user = new User(null, email, hash, salt);
        user.setName(name);
        user.setPhone(phone);
        return userRepository.save(user);
    }

    public String generateOtp() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // Helper to generate a 6-digit OTP
    private String generateSixDigitOtp() {
        return String.format("%06d", new java.util.Random().nextInt(1000000));
    }

    // Use this method everywhere OTP is set
    public void setOtpForUser(User user) {
        String otp = generateSixDigitOtp();
        user.setTwoFactorTempCode(otp); // Store plain 6-digit OTP
        user.setTwoFactorTempExpires(java.time.LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);
        sendOtpEmail(user.getEmail(), otp); // Send OTP to email
    }

    public void sendOtpEmail(String to, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Your Cognisafe OTP Code");
            helper.setText("Your OTP code is: " + otp + "\nIt is valid for 5 minutes.", false);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
        }
    }

    public boolean verifyOtp(User user, String otp) {
        if (user.getTwoFactorTempCode() == null || user.getTwoFactorTempExpires() == null) return false;
        if (user.getTwoFactorTempExpires().isBefore(LocalDateTime.now())) return false;
        boolean valid = otp.equals(user.getTwoFactorTempCode()); // Compare plain OTP
        if (valid) {
            user.setTwoFactorTempCode(null);
            user.setTwoFactorTempExpires(null);
            userRepository.save(user);
        }
        return valid;
    }

    public User login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return null;
        User user = userOpt.get();
        if (PasswordUtil.verifyPassword(password, user.getSalt(), user.getPasswordHash())) {
            return user;
        }
        return null;
    }

    public User getById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
} 