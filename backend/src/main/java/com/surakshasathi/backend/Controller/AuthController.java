package com.surakshasathi.backend.Controller;

import com.surakshasathi.backend.Repository.AdminRepo;
import com.surakshasathi.backend.Service.JwtService;
import com.surakshasathi.backend.dto.LoginReqDTO;
import com.surakshasathi.backend.entity.Admin;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {
    private final AdminRepo adminRepo;
    private final JwtService jwtService;

    @PostMapping("/login")
    public Map<String, String> login(
            @RequestBody LoginReqDTO dto
            )
    {
        Admin admin = adminRepo.findByUsername(dto.getUsername())
                .orElseThrow(()-> new RuntimeException("Admin Not Found"));

        if(!admin.getPassword().equals(dto.getPassword()))
        {
            throw new RuntimeException("Invalid Password");
        }
        String token = jwtService.generateToken(dto.getUsername());
        Map<String, String> map = new HashMap<>();
        map.put("token", token);
        return map;
    }

}
