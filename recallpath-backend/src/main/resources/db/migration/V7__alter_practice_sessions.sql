-- V7__alter_practice_sessions.sql

-- 1. Permitir MULTIPLE_CHOICE en practice_sessions.mode
ALTER TABLE practice_sessions
    DROP CONSTRAINT ck_practice_sessions_mode;

ALTER TABLE practice_sessions
    ADD CONSTRAINT ck_practice_sessions_mode
        CHECK (mode IN ('FLASHCARDS', 'MULTIPLE_CHOICE'));

-- 2. Columna JSON para las opciones de opción múltiple.
--    Solo se rellena cuando mode = 'MULTIPLE_CHOICE'; NULL en las demás sesiones.
ALTER TABLE practice_session_cards
    ADD COLUMN options_snapshot TEXT;
