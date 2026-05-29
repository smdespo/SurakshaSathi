package com.surakshasathi.backend.config;

import com.surakshasathi.backend.Repository.AdminRepo;
import com.surakshasathi.backend.entity.Admin;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {
    private final AdminRepo adminRepo;
    private final PasswordEncoder passwordEncoder;
    @Override
    public void run(String... args) throws Exception {
        adminRepo.deleteAll();
        System.out.println("🧹 [DatabaseSeeder] Stale, plain-text admin records wiped out cleanly!");

        // 2. Insert a brand new, explicitly encrypted admin using a fresh username
        Admin freshAdmin = new Admin();
        freshAdmin.setUsername("superadmin");

        // This guarantees the string is transformed into a valid $2a$ BCrypt hash
        freshAdmin.setPassword(passwordEncoder.encode("superpass123"));

        adminRepo.save(freshAdmin);

        System.out.println("🚀 [DatabaseSeeder] Brand-new BCrypt Admin Provisioned successfully!");
        System.out.println("👉 TARGET CREDENTIALS -> Username: superadmin | Password: superpass123");
    }
}
