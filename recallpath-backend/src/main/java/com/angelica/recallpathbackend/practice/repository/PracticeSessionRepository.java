package com.angelica.recallpathbackend.practice.repository;

import com.angelica.recallpathbackend.practice.entity.PracticeSession;
import com.angelica.recallpathbackend.practice.entity.PracticeStatus;
import com.angelica.recallpathbackend.practice.entity.PracticeMode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long> {
    Optional<PracticeSession> findFirstByDeckIdAndModeAndStatusOrderByCreatedAtDesc(Long deckId, PracticeMode mode, PracticeStatus status);
}
