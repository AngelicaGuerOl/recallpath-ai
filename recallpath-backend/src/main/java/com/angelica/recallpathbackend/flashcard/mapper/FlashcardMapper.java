package com.angelica.recallpathbackend.flashcard.mapper;

import com.angelica.recallpathbackend.flashcard.dto.CreateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.dto.FlashcardResponse;
import com.angelica.recallpathbackend.flashcard.dto.UpdateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface FlashcardMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deck", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Flashcard toEntity(CreateFlashcardRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deck", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdateFlashcardRequest request, @MappingTarget Flashcard flashcard);

    @Mapping(target = "deckId", source = "deck.id")
    @Mapping(target = "generationRunId", source = "generationRun.id")
    FlashcardResponse toResponse(Flashcard flashcard);
}
