package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.features.generation.dto.GenerationRunRequest;
import com.angelica.recallpathbackend.features.generation.entity.GenerationRun;

public interface GenerationRunService {
    GenerationRun createGenerationRun(Long documentId, GenerationRunRequest request);
    GenerationRun getGenerationRun(Long runId);
}
