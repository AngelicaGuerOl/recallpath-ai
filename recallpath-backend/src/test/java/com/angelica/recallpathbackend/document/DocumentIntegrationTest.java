package com.angelica.recallpathbackend.document;

import com.angelica.recallpathbackend.document.dto.DocumentDto;
import com.angelica.recallpathbackend.document.dto.DocumentPageListDto;
import com.angelica.recallpathbackend.document.entity.DocumentStatus;
import com.angelica.recallpathbackend.document.exception.DocumentProcessingException;
import com.angelica.recallpathbackend.document.repository.DocumentPageRepository;
import com.angelica.recallpathbackend.document.repository.DocumentRepository;
import com.angelica.recallpathbackend.document.service.DocumentService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Testcontainers
class DocumentIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("DOCUMENT_STORAGE_PATH", () -> System.getProperty("java.io.tmpdir"));
    }

    @Autowired
    private DocumentService documentService;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentPageRepository documentPageRepository;

    @BeforeEach
    void setUp() {
        documentPageRepository.deleteAll();
        documentRepository.deleteAll();
    }

    private byte[] createTestPdf(String text) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream contents = new PDPageContentStream(doc, page)) {
                contents.beginText();
                contents.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contents.newLineAtOffset(100, 700);
                contents.showText(text);
                contents.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    @Test
    void testUploadValidPdf() throws IOException {
        byte[] pdfBytes = createTestPdf("Este es un texto de prueba válido que supera el mínimo de 10 caracteres.");
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfBytes);

        DocumentDto doc = documentService.uploadDocument(file);

        assertThat(doc.status()).isEqualTo("READY");
        assertThat(doc.pageCount()).isEqualTo(1);
        assertThat(doc.originalFileName()).isEqualTo("test.pdf");

        DocumentPageListDto pages = documentService.getDocumentPages(doc.id(), 1, 1);
        assertThat(pages.pages()).hasSize(1);
        assertThat(pages.pages().getFirst().extractedText()).contains("Este es un texto");
    }

    @Test
    void testUploadEmptyFile() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        DocumentProcessingException ex = assertThrows(DocumentProcessingException.class, () -> documentService.uploadDocument(file));
        assertThat(ex.getMessage()).contains("vacío");
    }

    @Test
    void testUploadNotPdf() {
        MockMultipartFile file = new MockMultipartFile("file", "image.png", "image/png", "not a pdf".getBytes());
        DocumentProcessingException ex = assertThrows(DocumentProcessingException.class, () -> documentService.uploadDocument(file));
        assertThat(ex.getMessage()).contains("debe ser un documento PDF");
    }

    @Test
    void testUploadPdfWithoutEnoughText() throws IOException {
        byte[] pdfBytes = createTestPdf("a"); // solo un caracter
        MockMultipartFile file = new MockMultipartFile("file", "short.pdf", "application/pdf", pdfBytes);

        DocumentDto doc = documentService.uploadDocument(file);
        assertThat(doc.status()).isEqualTo("FAILED");
        assertThat(doc.errorMessage()).contains("No se encontró suficiente texto");
    }

    @Test
    void testArchiveAndRestore() throws IOException {
        byte[] pdfBytes = createTestPdf("Este es un texto de prueba válido.");
        MockMultipartFile file = new MockMultipartFile("file", "test2.pdf", "application/pdf", pdfBytes);

        DocumentDto doc = documentService.uploadDocument(file);
        assertThat(doc.status()).isEqualTo("READY");

        DocumentDto archived = documentService.archiveDocument(doc.id());
        assertThat(archived.status()).isEqualTo("ARCHIVED");

        DocumentDto restored = documentService.restoreDocument(doc.id());
        assertThat(restored.status()).isEqualTo("READY");
    }
}
