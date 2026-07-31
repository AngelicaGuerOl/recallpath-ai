package com.angelica.recallpathbackend.features.generation.service;

import java.text.Normalizer;

public class TextNormalizer {

    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        
        // 1. Unicode NFKC
        String n = Normalizer.normalize(text, Normalizer.Form.NFKC);
        
        // 2. NBSP (\u00A0) to space
        n = n.replace("\u00A0", " ");
        
        // 3. Remove soft hyphen (\u00AD)
        n = n.replace("\u00AD", "");
        
        // 4. Join hyphenated words split across lines
        // A hyphen followed by optional whitespace, a newline, and optional whitespace
        n = n.replaceAll("-\\s*\\n\\s*", "");
        
        // 5. Curved quotes to normal quotes
        n = n.replaceAll("[“”]", "\"").replaceAll("[‘’]", "'");
        
        // 6. Em/En dashes to normal dash
        n = n.replaceAll("[—–]", "-");
        
        // 7. Multiple spaces/newlines to single space
        n = n.replaceAll("\\s+", " ");
        
        // 8. Trim and lowercase
        return n.trim().toLowerCase();
    }
}
