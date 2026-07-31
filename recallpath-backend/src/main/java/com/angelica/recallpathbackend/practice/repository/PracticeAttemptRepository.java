package com.angelica.recallpathbackend.practice.repository;

import com.angelica.recallpathbackend.practice.entity.PracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PracticeAttemptRepository extends JpaRepository<PracticeAttempt, Long> {
    List<PracticeAttempt> findBySessionCardSessionId(Long sessionId);
}
