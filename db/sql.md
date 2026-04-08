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

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL
);
```
