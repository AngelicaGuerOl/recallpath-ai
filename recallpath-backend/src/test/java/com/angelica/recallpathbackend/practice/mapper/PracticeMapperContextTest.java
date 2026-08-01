package com.angelica.recallpathbackend.practice.mapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class PracticeMapperContextTest {

    @Autowired
    private PracticeMapper practiceMapper;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() {
        // This test ensures that Spring can start up and inject the dependencies properly.
        // If Jackson 3 ObjectMapper is missing, this test will fail to load the ApplicationContext.
        assertNotNull(practiceMapper);
        assertNotNull(objectMapper);
    }
}
