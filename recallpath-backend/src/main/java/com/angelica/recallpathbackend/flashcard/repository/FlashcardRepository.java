package com.angelica.recallpathbackend.flashcard.repository;

import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    List<Flashcard> findByDeckIdOrderByCreatedAtDescIdDesc(Long deckId);

    Optional<Flashcard> findByIdAndDeckId(Long id, Long deckId);

    @Query(value = """
            select exists(
                select 1
                from flashcards f
                where f.deck_id = :deckId
                  and f.id <> :excludedId
                  and lower(regexp_replace(btrim(f.term), '[[:space:]]+', ' ', 'g'))
                      = lower(regexp_replace(btrim(:term), '[[:space:]]+', ' ', 'g'))
            )
            """, nativeQuery = true)
    boolean existsEquivalentTerm(
            @Param("deckId") Long deckId,
            @Param("excludedId") long excludedId,
            @Param("term") String term
    );
}
