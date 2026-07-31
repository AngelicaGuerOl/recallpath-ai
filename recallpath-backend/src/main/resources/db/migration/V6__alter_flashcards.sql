ALTER TABLE flashcards ADD COLUMN origin VARCHAR(20) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE flashcards ADD CONSTRAINT ck_flashcards_origin CHECK (origin IN ('MANUAL', 'AI_GENERATED'));

ALTER TABLE flashcards ADD COLUMN generation_run_id BIGINT;
ALTER TABLE flashcards ADD CONSTRAINT fk_flashcards_generation_run FOREIGN KEY (generation_run_id) REFERENCES generation_runs(id);

ALTER TABLE flashcards ADD COLUMN source_page INTEGER;
ALTER TABLE flashcards ADD COLUMN source_excerpt TEXT;

ALTER TABLE flashcards DROP CONSTRAINT ck_flashcards_status;
ALTER TABLE flashcards ADD CONSTRAINT ck_flashcards_status CHECK (status IN ('ACTIVE', 'ARCHIVED', 'GENERATED', 'REJECTED'));

DROP INDEX ux_flashcards_deck_normalized_term;
CREATE UNIQUE INDEX ux_flashcards_deck_normalized_term
    ON flashcards (deck_id, lower(regexp_replace(btrim(term), '[[:space:]]+', ' ', 'g')))
    WHERE status = 'ACTIVE';
