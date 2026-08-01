package com.angelica.recallpathbackend.practice.entity;

import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "practice_session_cards")
public class PracticeSessionCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PracticeSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Column(nullable = false)
    private Integer position;

    @Column(name = "term_snapshot", nullable = false, columnDefinition = "TEXT")
    private String termSnapshot;

    @Column(name = "definition_snapshot", nullable = false, columnDefinition = "TEXT")
    private String definitionSnapshot;

    @Column(name = "category_snapshot", length = 120)
    private String categorySnapshot;

    @Column(name = "difficulty_snapshot", nullable = false, length = 20)
    private String difficultySnapshot;

    @Column(name = "options_snapshot", columnDefinition = "TEXT")
    private String optionsSnapshot;

    @Column(nullable = false)
    private Boolean answered = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (answered == null) answered = false;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public PracticeSession getSession() { return session; }
    public void setSession(PracticeSession session) { this.session = session; }
    
    public Flashcard getFlashcard() { return flashcard; }
    public void setFlashcard(Flashcard flashcard) { this.flashcard = flashcard; }
    
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    
    public String getTermSnapshot() { return termSnapshot; }
    public void setTermSnapshot(String termSnapshot) { this.termSnapshot = termSnapshot; }
    
    public String getDefinitionSnapshot() { return definitionSnapshot; }
    public void setDefinitionSnapshot(String definitionSnapshot) { this.definitionSnapshot = definitionSnapshot; }
    
    public String getCategorySnapshot() { return categorySnapshot; }
    public void setCategorySnapshot(String categorySnapshot) { this.categorySnapshot = categorySnapshot; }
    
    public String getDifficultySnapshot() { return difficultySnapshot; }
    public void setDifficultySnapshot(String difficultySnapshot) { this.difficultySnapshot = difficultySnapshot; }

    public String getOptionsSnapshot() { return optionsSnapshot; }
    public void setOptionsSnapshot(String optionsSnapshot) { this.optionsSnapshot = optionsSnapshot; }
    
    public Boolean getAnswered() { return answered; }
    public void setAnswered(Boolean answered) { this.answered = answered; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
