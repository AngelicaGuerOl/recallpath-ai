package com.angelica.recallpathbackend.document.dto;

import com.angelica.recallpathbackend.document.entity.Document;
import com.angelica.recallpathbackend.document.entity.DocumentPage;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DocumentMapper {
    DocumentDto toDto(Document document);
    DocumentPageDto toDto(DocumentPage page);
}
