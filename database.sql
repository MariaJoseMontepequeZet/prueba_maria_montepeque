SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP DATABASE IF EXISTS recruitment_db;
CREATE DATABASE recruitment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE recruitment_db;

CREATE TABLE candidates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  years_experience TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_candidates_email UNIQUE (email),
  CONSTRAINT chk_candidates_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE = InnoDB;

CREATE TABLE vacancies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  min_years_experience TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_vacancies_title CHECK (CHAR_LENGTH(TRIM(title)) > 0)
) ENGINE = InnoDB;

CREATE TABLE applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT UNSIGNED NOT NULL,
  vacancy_id INT UNSIGNED NOT NULL,
  cover_letter TEXT NOT NULL,
  source ENUM('REFERRAL', 'INTERNAL', 'JOB_BOARD', 'OTHER') NOT NULL,
  score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'TOP') NOT NULL,
  status ENUM('RECEIVED', 'IN_REVIEW', 'REJECTED', 'HIRED') NOT NULL DEFAULT 'RECEIVED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_applications_vacancy FOREIGN KEY (vacancy_id) REFERENCES vacancies (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_applications_dates CHECK (status_updated_at >= created_at),
  INDEX idx_applications_candidate_vacancy (candidate_id, vacancy_id, status),
  INDEX idx_applications_status_vacancy (status, vacancy_id),
  INDEX idx_applications_ranking (score DESC, created_at ASC)
) ENGINE = InnoDB;

INSERT INTO candidates (name, email, years_experience) VALUES
  ('Ana López', 'ana.lopez@example.com', 5),
  ('Carlos Pérez', 'carlos.perez@example.com', 1),
  ('María García', 'maria.garcia@example.com', 4),
  ('Luis Martínez', 'luis.martinez@example.com', 2),
  ('Sofía Ramírez', 'sofia.ramirez@example.com', 7);

INSERT INTO vacancies (title, min_years_experience, status) VALUES
  ('Backend Developer Node.js', 3, 'OPEN'),
  ('Data Analyst SQL', 2, 'OPEN'),
  ('QA Engineer', 1, 'OPEN'),
  ('DevOps Engineer', 4, 'OPEN'),
  ('Frontend Developer', 2, 'CLOSED');

INSERT INTO applications (candidate_id, vacancy_id, cover_letter, source, score, priority, status, created_at, status_updated_at) VALUES
  (5, 2, 'Experienced building SQL reports and dashboards', 'JOB_BOARD', 6, 'HIGH', 'IN_REVIEW', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 2 DAY),
  (5, 3, 'I enjoy designing test plans', 'OTHER', 4, 'MEDIUM', 'RECEIVED', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
  (5, 4, 'Current member of the infrastructure team', 'INTERNAL', 6, 'HIGH', 'RECEIVED', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  (2, 1, 'Junior developer eager to learn', 'JOB_BOARD', 0, 'LOW', 'REJECTED', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 10 DAY),
  (4, 1, 'Looking for professional growth', 'OTHER', 0, 'LOW', 'REJECTED', NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 45 DAY);
