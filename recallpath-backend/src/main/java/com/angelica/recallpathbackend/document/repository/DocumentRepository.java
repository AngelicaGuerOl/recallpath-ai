package com.angelica.recallpathbackend.document.repository;

import com.angelica.recallpathbackend.document.entity.Document;
import com.angelica.recallpathbackend.document.entity.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findAllByOrderByCreatedAtDesc();
    List<Document> findByStatusOrderByCreatedAtDesc(DocumentStatus status);
    List<Document> findByOriginalFileNameContainingIgnoreCaseOrderByCreatedAtDesc(String name);
    List<Document> findByOriginalFileNameContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(String name, DocumentStatus status);
}
