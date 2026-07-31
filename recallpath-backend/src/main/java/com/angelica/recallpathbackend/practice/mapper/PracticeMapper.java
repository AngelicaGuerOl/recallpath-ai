package com.angelica.recallpathbackend.practice.mapper;

import com.angelica.recallpathbackend.practice.dto.PracticeSessionCardResponse;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionResponse;
import com.angelica.recallpathbackend.practice.entity.PracticeSession;
import com.angelica.recallpathbackend.practice.entity.PracticeSessionCard;
import org.springframework.stereotype.Component;

@Component
public class PracticeMapper {

    public PracticeSessionCardResponse toCardResponse(PracticeSessionCard card) {
        if (card == null) return null;
        return new PracticeSessionCardResponse(
            card.getId(),
            card.getPosition(),
            card.getTermSnapshot(),
            card.getDefinitionSnapshot(),
            card.getCategorySnapshot(),
            card.getDifficultySnapshot(),
            card.getAnswered()
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
