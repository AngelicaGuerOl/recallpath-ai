package com.angelica.recallpathbackend.document.service;

import com.angelica.recallpathbackend.document.dto.DocumentDto;
import com.angelica.recallpathbackend.document.dto.DocumentPageListDto;
import com.angelica.recallpathbackend.document.entity.DocumentStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService {
    DocumentDto uploadDocument(MultipartFile file);
    List<DocumentDto> getDocuments(String search, DocumentStatus status);
    DocumentDto getDocument(Long id);
    DocumentPageListDto getDocumentPages(Long id, int from, int to);
    DocumentDto archiveDocument(Long id);
    DocumentDto restoreDocument(Long id);
}
