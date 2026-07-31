package com.angelica.recallpathbackend.practice.repository;

import com.angelica.recallpathbackend.practice.entity.PracticeSessionCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PracticeSessionCardRepository extends JpaRepository<PracticeSessionCard, Long> {
    List<PracticeSessionCard> findBySessionIdOrderByPositionAsc(Long sessionId);
    Optional<PracticeSessionCard> findFirstBySessionIdAndAnsweredFalseOrderByPositionAsc(Long sessionId);
}
