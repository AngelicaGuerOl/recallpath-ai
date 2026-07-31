package com.angelica.recallpathbackend.practice.entity;

import com.angelica.recallpathbackend.deck.entity.Deck;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "practice_sessions")
public class PracticeSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PracticeMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PracticeStatus status;

    @Column(name = "total_cards", nullable = false)
    private Integer totalCards;

    @Column(name = "completed_cards", nullable = false)
    private Integer completedCards = 0;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (startedAt == null) startedAt = now;
        if (completedCards == null) completedCards = 0;
        if (status == null) status = PracticeStatus.IN_PROGRESS;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Deck getDeck() { return deck; }
    public void setDeck(Deck deck) { this.deck = deck; }
    
    public PracticeMode getMode() { return mode; }
    public void setMode(PracticeMode mode) { this.mode = mode; }
    
    public PracticeStatus getStatus() { return status; }
    public void setStatus(PracticeStatus status) { this.status = status; }
    
    public Integer getTotalCards() { return totalCards; }
    public void setTotalCards(Integer totalCards) { this.totalCards = totalCards; }
    
    public Integer getCompletedCards() { return completedCards; }
    public void setCompletedCards(Integer completedCards) { this.completedCards = completedCards; }
    
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
