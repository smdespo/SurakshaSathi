package com.surakshasathi.backend.Controller;

import com.surakshasathi.backend.Repository.AdminRepo;
import com.surakshasathi.backend.Service.JwtService;
import com.surakshasathi.backend.dto.LoginReqDTO;
import com.surakshasathi.backend.entity.Admin;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {
    private final AdminRepo adminRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    @PostMapping("/login")
    public Map<String, String> login(
            @RequestBody LoginReqDTO dto
            )
    {
      Admin admin = adminRepo.findByUsername(dto.getUsername())
              .orElseThrow(()-> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
      if(!passwordEncoder.matches(dto.getPassword(), admin.getPassword())){
          throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
      }
      String token = jwtService.generateToken(dto.getUsername());
      return Map.of("token", token, "username", admin.getUsername());
    }

}
