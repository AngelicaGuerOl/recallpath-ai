package com.angelica.recallpathbackend.deck.repository;

import com.angelica.recallpathbackend.deck.entity.Deck;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeckRepository extends JpaRepository<Deck, Long> {

    @Query("""
            select d from Deck d
            where (:archived is null
                    or (:archived = true and d.archivedAt is not null)
                    or (:archived = false and d.archivedAt is null))
              and (:search = '' or lower(d.name) like lower(concat('%', :search, '%')))
            """)
    Page<Deck> search(@Param("search") String search, @Param("archived") Boolean archived, Pageable pageable);
}
