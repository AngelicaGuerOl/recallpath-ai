-- V10__add_written_response_mode.sql

ALTER TABLE practice_sessions
    DROP CONSTRAINT ck_practice_sessions_mode;

ALTER TABLE practice_sessions
    ADD CONSTRAINT ck_practice_sessions_mode
        CHECK (mode IN ('FLASHCARDS', 'MULTIPLE_CHOICE', 'WRITTEN_RESPONSE'));
