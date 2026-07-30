package com.angelica.recallpathbackend.deck.mapper;

import com.angelica.recallpathbackend.deck.dto.CreateDeckRequest;
import com.angelica.recallpathbackend.deck.dto.DeckResponse;
import com.angelica.recallpathbackend.deck.dto.UpdateDeckRequest;
import com.angelica.recallpathbackend.deck.entity.Deck;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DeckMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "archivedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Deck toEntity(CreateDeckRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "archivedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdateDeckRequest request, @MappingTarget Deck deck);

    DeckResponse toResponse(Deck deck);
}
