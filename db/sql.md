## Table of Content
- [SQL](#sql)

### SQL
```sql
CREATE DATABASE folio;
USE folio;

CREATE USER 'folio'@'%' IDENTIFIED BY '0111';
GRANT ALL PRIVILEGES ON *.* TO 'folio'@'%';
FLUSH PRIVILEGES;

ALTER USER 'folio'@'%' IDENTIFIED WITH mysql_native_password BY '0111';
FLUSH PRIVILEGES;

CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

DELIMITER //

CREATE TRIGGER set_expiry_time
BEFORE INSERT ON password_reset_tokens
FOR EACH ROW
BEGIN
  SET NEW.expires_at = NOW() + INTERVAL 2 HOUR;
END//

DELIMITER ;


CREATE EVENT delete_expired_tokens
ON SCHEDULE EVERY 1 HOUR
DO
  DELETE FROM password_reset_tokens WHERE expires_at < NOW();



SHOW PROCESSLIST;

-- Wenn der Event Scheduler deaktiviert ist, aktivieren Sie ihn mit folgendem Befehl:
SET GLOBAL event_scheduler = ON;


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    pwd VARCHAR(255) NOT NULL,
    role ENUM('visitor', 'admin', 'student') DEFAULT 'visitor',
    status ENUM('active', 'inactive') DEFAULT 'inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT
);

CREATE TABLE portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE,
    longitude DOUBLE,
    user_id INT,
    year_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (year_id) REFERENCES years(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (work_id) REFERENCES portfolios(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE video (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    video_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (work_id) REFERENCES portfolios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE audio(
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    audio_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (work_id) REFERENCES portfolios(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE pdf (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    pdf_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (work_id) REFERENCES portfolios(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE panorama (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    panorama_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (work_id) REFERENCES portfolios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE url (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (work_id) REFERENCES portfolios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ThreeDObject (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    ThreeDObject_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (work_id) REFERENCES portfolios(id) ON DELETE CASCADE ON UPDATE CASCADE
);
```
