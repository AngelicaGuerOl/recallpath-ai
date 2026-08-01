package com.angelica.recallpathbackend.practice.mapper;

import com.angelica.recallpathbackend.practice.dto.MultipleChoiceOptionDto;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionCardResponse;
import com.angelica.recallpathbackend.practice.entity.PracticeSessionCard;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PracticeMapperTest {

    private PracticeMapper mapper;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mapper = new PracticeMapper(objectMapper);
    }

    @Test
    void toCardResponse_NullCard_ReturnsNull() {
        assertNull(mapper.toCardResponse(null));
    }

    @Test
    void toCardResponse_NoOptionsSnapshot_ReturnsNullOptions() {
        PracticeSessionCard card = new PracticeSessionCard();
        card.setId(1L);
        card.setOptionsSnapshot(null);

        PracticeSessionCardResponse response = mapper.toCardResponse(card);
        assertNull(response.options());
    }

    @Test
    void toCardResponse_ValidOptionsSnapshot_ReturnsOptionsPreservingOrder() {
        PracticeSessionCard card = new PracticeSessionCard();
        card.setId(1L);
        // JSON Array string with specific order
        String snapshot = "[{\"text\":\"Option B\",\"correct\":false},{\"text\":\"Option A\",\"correct\":true}]";
        card.setOptionsSnapshot(snapshot);

        PracticeSessionCardResponse response = mapper.toCardResponse(card);

        assertNotNull(response.options());
        assertEquals(2, response.options().size());
        
        // Order must be preserved
        assertEquals("Option B", response.options().get(0).text());
        assertFalse(response.options().get(0).correct());
        
        assertEquals("Option A", response.options().get(1).text());
        assertTrue(response.options().get(1).correct());
    }

    @Test
    void toCardResponse_EmptyOptionsSnapshot_ReturnsEmptyList() {
        PracticeSessionCard card = new PracticeSessionCard();
        card.setId(1L);
        card.setOptionsSnapshot("[]");

        PracticeSessionCardResponse response = mapper.toCardResponse(card);

        assertNotNull(response.options());
        assertTrue(response.options().isEmpty());
    }

    @Test
    void toCardResponse_InvalidJson_ReturnsEmptyList() {
        PracticeSessionCard card = new PracticeSessionCard();
        card.setId(1L);
        // Invalid JSON string (missing bracket, malformed)
        card.setOptionsSnapshot("[{\"text\":\"Option B\",");

        PracticeSessionCardResponse response = mapper.toCardResponse(card);

        // According to our mapper, it catches JacksonException and returns Collections.emptyList()
        assertNotNull(response.options());
        assertTrue(response.options().isEmpty());
    }
}
