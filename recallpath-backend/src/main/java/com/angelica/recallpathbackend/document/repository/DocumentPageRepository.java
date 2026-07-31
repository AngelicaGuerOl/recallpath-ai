package com.angelica.recallpathbackend.document.repository;

import com.angelica.recallpathbackend.document.entity.DocumentPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentPageRepository extends JpaRepository<DocumentPage, Long> {
    List<DocumentPage> findByDocumentIdAndPageNumberBetweenOrderByPageNumberAsc(Long documentId, int start, int end);
}
