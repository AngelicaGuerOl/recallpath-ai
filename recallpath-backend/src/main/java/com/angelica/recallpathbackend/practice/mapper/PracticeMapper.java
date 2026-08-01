package com.angelica.recallpathbackend.practice.mapper;

import com.angelica.recallpathbackend.practice.dto.MultipleChoiceOptionDto;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionCardResponse;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionResponse;
import com.angelica.recallpathbackend.practice.entity.PracticeSession;
import com.angelica.recallpathbackend.practice.entity.PracticeSessionCard;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class PracticeMapper {

    private static final TypeReference<List<MultipleChoiceOptionDto>> OPTIONS_TYPE =
            new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    public PracticeMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public PracticeSessionCardResponse toCardResponse(PracticeSessionCard card) {
        if (card == null) return null;

        List<MultipleChoiceOptionDto> options = null;
        if (card.getOptionsSnapshot() != null) {
            try {
                options = objectMapper.readValue(card.getOptionsSnapshot(), OPTIONS_TYPE);
            } catch (JacksonException e) {
                options = Collections.emptyList();
            }
        }

        return new PracticeSessionCardResponse(
            card.getId(),
            card.getPosition(),
            card.getTermSnapshot(),
            card.getDefinitionSnapshot(),
            card.getCategorySnapshot(),
            card.getDifficultySnapshot(),
            card.getAnswered(),
            options
        );
    }

    public PracticeSessionResponse toSessionResponse(PracticeSession session, PracticeSessionCard currentCard) {
        return new PracticeSessionResponse(
            session.getId(),
            session.getDeck().getId(),
            session.getMode().name(),
            session.getStatus().name(),
            session.getTotalCards(),
            session.getCompletedCards(),
            toCardResponse(currentCard),
            session.getStartedAt(),
            session.getCompletedAt()
        );
    }
}
