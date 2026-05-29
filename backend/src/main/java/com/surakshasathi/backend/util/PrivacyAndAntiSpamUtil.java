package com.surakshasathi.backend.util;


import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

public class PrivacyAndAntiSpamUtil {
    public String hashIpAddress(String ipAddress) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(ipAddress.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
    public boolean containsAbusiveOrSpamKeywords(String text)
    {
        if(text==null || text.isEmpty())
        {
            return false;
        }
        List<String> spamKeywords = List.of("fake","testtest","qwerty","prank");
        String lowerCaseText = text.toLowerCase();
        return spamKeywords.stream().anyMatch(lowerCaseText::contains);
    }
}
