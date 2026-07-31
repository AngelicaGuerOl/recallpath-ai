package com.angelica.recallpathbackend.document.service;

import com.angelica.recallpathbackend.document.dto.DocumentDto;
import com.angelica.recallpathbackend.document.dto.DocumentMapper;
import com.angelica.recallpathbackend.document.dto.DocumentPageDto;
import com.angelica.recallpathbackend.document.dto.DocumentPageListDto;
import com.angelica.recallpathbackend.document.entity.Document;
import com.angelica.recallpathbackend.document.entity.DocumentPage;
import com.angelica.recallpathbackend.document.entity.DocumentStatus;
import com.angelica.recallpathbackend.document.exception.DocumentNotFoundException;
import com.angelica.recallpathbackend.document.exception.DocumentProcessingException;
import com.angelica.recallpathbackend.document.repository.DocumentPageRepository;
import com.angelica.recallpathbackend.document.repository.DocumentRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentServiceImpl implements DocumentService {
    private static final Logger log = LoggerFactory.getLogger(DocumentServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final DocumentPageRepository documentPageRepository;
    private final DocumentMapper documentMapper;

    @Value("${DOCUMENT_STORAGE_PATH:/app/documents}")
    private String storagePath;

    @Value("${DOCUMENT_MAX_FILE_SIZE:10485760}")
    private long maxFileSize; // 10MB

    @Value("${DOCUMENT_MAX_PAGE_COUNT:100}")
    private int maxPageCount;

    @Value("${DOCUMENT_MIN_EXTRACTED_CHARACTERS:10}")
    private int minExtractedCharacters;

    public DocumentServiceImpl(DocumentRepository documentRepository, DocumentPageRepository documentPageRepository, DocumentMapper documentMapper) {
        this.documentRepository = documentRepository;
        this.documentPageRepository = documentPageRepository;
        this.documentMapper = documentMapper;
    }

    @Override
    @Transactional
    public DocumentDto uploadDocument(MultipartFile file) {
        validateFile(file);

        // Save file physically
        String originalName = sanitizeFileName(file.getOriginalFilename());
        String storedName = UUID.randomUUID().toString() + ".pdf";
        Path targetPath = Paths.get(storagePath, storedName).normalize();

        // Path traversal protection
        if (!targetPath.startsWith(Paths.get(storagePath).normalize())) {
            throw new DocumentProcessingException("Ruta de archivo inválida");
        }

        try {
            Files.createDirectories(targetPath.getParent());
            file.transferTo(targetPath.toFile());
        } catch (IOException e) {
            log.error("Failed to save document", e);
            throw new DocumentProcessingException("No fue posible guardar el archivo PDF");
        }

        // Create entity
        Document document = new Document();
        document.setOriginalFileName(originalName);
        document.setStoredFileName(storedName);
        document.setContentType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setStatus(DocumentStatus.UPLOADED);
        document = documentRepository.save(document);

        // Process document
        processDocument(document, targetPath.toFile());

        return documentMapper.toDto(document);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new DocumentProcessingException("El archivo está vacío");
        }
        if (file.getSize() > maxFileSize) {
            throw new DocumentProcessingException("El documento supera el tamaño permitido");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new DocumentProcessingException("El archivo debe ser un documento PDF");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new DocumentProcessingException("El archivo debe ser un documento PDF");
        }
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null) return "document.pdf";
        return fileName.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
    }

    private void processDocument(Document document, File file) {
        document.setStatus(DocumentStatus.EXTRACTING);
        documentRepository.saveAndFlush(document);

        int totalCharacters = 0;
        List<DocumentPage> pages = new ArrayList<>();

        try (PDDocument pdDoc = org.apache.pdfbox.Loader.loadPDF(file)) {
            if (pdDoc.isEncrypted()) {
                throw new DocumentProcessingException("El documento está protegido con contraseña.");
            }

            int pageCount = pdDoc.getNumberOfPages();
            if (pageCount > maxPageCount) {
                throw new DocumentProcessingException("El documento supera el número máximo de páginas.");
            }
            document.setPageCount(pageCount);

            PDFTextStripper stripper = new PDFTextStripper();

            for (int i = 1; i <= pageCount; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String text = stripper.getText(pdDoc);
                
                if (text == null) text = "";
                text = text.trim();
                
                DocumentPage page = new DocumentPage();
                page.setDocument(document);
                page.setPageNumber(i);
                page.setExtractedText(text);
                page.setCharacterCount(text.length());
                pages.add(page);

                totalCharacters += text.length();
            }

            if (totalCharacters < minExtractedCharacters) {
                throw new DocumentProcessingException("No se encontró suficiente texto extraíble. Esta versión no admite documentos escaneados ni OCR.");
            }

            document.getPages().addAll(pages);
            document.setStatus(DocumentStatus.READY);

        } catch (DocumentProcessingException e) {
            document.setStatus(DocumentStatus.FAILED);
            document.setErrorMessage(e.getMessage());
            log.warn("Document processing failed for id {}: {}", document.getId(), e.getMessage());
        } catch (Exception e) {
            document.setStatus(DocumentStatus.FAILED);
            document.setErrorMessage("No fue posible procesar el documento PDF.");
            log.error("Unexpected error processing document id {}", document.getId(), e);
        }

        documentRepository.save(document);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto> getDocuments(String search, DocumentStatus status) {
        List<Document> docs;
        if (search != null && !search.isEmpty()) {
            if (status != null) {
                docs = documentRepository.findByOriginalFileNameContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(search, status);
            } else {
                docs = documentRepository.findByOriginalFileNameContainingIgnoreCaseOrderByCreatedAtDesc(search);
            }
        } else {
            if (status != null) {
                docs = documentRepository.findByStatusOrderByCreatedAtDesc(status);
            } else {
                docs = documentRepository.findAllByOrderByCreatedAtDesc();
            }
        }
        return docs.stream().map(documentMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto getDocument(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        return documentMapper.toDto(doc);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentPageListDto getDocumentPages(Long id, int from, int to) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
                
        if (from > to || from < 1) {
            throw new DocumentProcessingException("Intervalo de páginas inválido");
        }

        List<DocumentPage> pages = documentPageRepository.findByDocumentIdAndPageNumberBetweenOrderByPageNumberAsc(id, from, to);
        List<DocumentPageDto> pageDtos = pages.stream().map(documentMapper::toDto).collect(Collectors.toList());
        return new DocumentPageListDto(pageDtos, doc.getPageCount());
    }

    @Override
    @Transactional
    public DocumentDto archiveDocument(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        doc.setStatus(DocumentStatus.ARCHIVED);
        return documentMapper.toDto(documentRepository.save(doc));
    }

    @Override
    @Transactional
    public DocumentDto restoreDocument(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        
        if (doc.getStatus() == DocumentStatus.ARCHIVED) {
            if (doc.getErrorMessage() != null) {
                doc.setStatus(DocumentStatus.FAILED);
            } else if (doc.getPageCount() != null && doc.getPages() != null && !doc.getPages().isEmpty()) {
                doc.setStatus(DocumentStatus.READY);
            } else {
                doc.setStatus(DocumentStatus.UPLOADED);
            }
        }
        return documentMapper.toDto(documentRepository.save(doc));
    }
}
