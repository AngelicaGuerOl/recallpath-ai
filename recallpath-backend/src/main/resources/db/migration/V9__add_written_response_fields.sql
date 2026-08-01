ALTER TABLE practice_attempts
ADD COLUMN feedback TEXT,
ADD COLUMN provider VARCHAR(50),
ADD COLUMN model VARCHAR(100);
