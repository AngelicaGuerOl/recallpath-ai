package com.angelica.recallpathbackend.document.controller;

import com.angelica.recallpathbackend.document.dto.DocumentDto;
import com.angelica.recallpathbackend.document.dto.DocumentPageListDto;
import com.angelica.recallpathbackend.document.entity.DocumentStatus;
import com.angelica.recallpathbackend.document.service.DocumentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDto> uploadDocument(@RequestParam("file") MultipartFile file) {
        DocumentDto saved = documentService.uploadDocument(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<DocumentDto>> getDocuments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) DocumentStatus status) {
        return ResponseEntity.ok(documentService.getDocuments(search, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDto> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }

    @GetMapping("/{id}/pages")
    public ResponseEntity<DocumentPageListDto> getDocumentPages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int from,
            @RequestParam(defaultValue = "10") int to) {
        return ResponseEntity.ok(documentService.getDocumentPages(id, from, to));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<DocumentDto> archiveDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.archiveDocument(id));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<DocumentDto> restoreDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.restoreDocument(id));
    }
}
