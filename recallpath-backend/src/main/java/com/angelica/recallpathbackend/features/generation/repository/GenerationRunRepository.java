package com.angelica.recallpathbackend.features.generation.repository;

import com.angelica.recallpathbackend.features.generation.entity.GenerationRun;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenerationRunRepository extends JpaRepository<GenerationRun, Long> {
}
