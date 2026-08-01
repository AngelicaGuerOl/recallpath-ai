package com.angelica.recallpathbackend.practice.repository;

import com.angelica.recallpathbackend.practice.entity.PracticeAttempt;
import com.angelica.recallpathbackend.practice.entity.PracticeResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PracticeAttemptRepository extends JpaRepository<PracticeAttempt, Long> {

    List<PracticeAttempt> findBySessionCardSessionId(Long sessionId);

    /**
     * Devuelve los IDs de flashcard que tuvieron un resultado específico en la sesión.
     * Se usa para construir la lista de "incorrectas" al iniciar una nueva sesión
     * con {@code incorrectOnly=true}.
     */
    @Query("SELECT a.sessionCard.flashcard.id FROM PracticeAttempt a " +
           "WHERE a.sessionCard.session.id = :sessionId AND a.result = :result")
    List<Long> findFlashcardIdsBySessionIdAndResult(
            @Param("sessionId") Long sessionId,
            @Param("result") PracticeResult result);
}
