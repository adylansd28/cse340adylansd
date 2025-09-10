-- 0) Limpieza por si ya existen
DROP TABLE IF EXISTS post;
DROP TABLE IF EXISTS "user";

-- 1) Crear tabla "user" (moderna con IDENTITY)
CREATE TABLE "user" (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name      VARCHAR(100),
  email     VARCHAR(255) UNIQUE NOT NULL,
  password  TEXT        NOT NULL,
  age       INTEGER
);

-- (Si prefieres la versión del video con SERIAL, usa esto en vez de la línea de id:
--   id BIGSERIAL PRIMARY KEY,
-- )

-- 2) Insertar usuarios (nota: no insertamos id)
INSERT INTO "user" (email, name, age, password)
VALUES
  ('troy@fake.email', 'troy', 26, 'hash_or_nonsense_here'),
  ('chris@another.example', 'chris', 98, 'wow_i_love_sql_28');

-- 3) SELECTs básicos
-- 3.1) Todo
SELECT * FROM "user";

-- 3.2) Solo algunas columnas
SELECT id, email, name FROM "user";

-- 3.3) Filtrar
SELECT * FROM "user" WHERE name = 'troy';
SELECT * FROM "user" WHERE age > 27;

-- 4) UPDATE (cambiar edad de troy a 30)
UPDATE "user"
SET age = 30
WHERE id = 1;  -- ¡Siempre usa WHERE!

-- Verifica
SELECT id, name, age FROM "user" WHERE id = 1;

-- 5) DELETE (eliminar a chris, id=2)
DELETE FROM "user"
WHERE id = 2;

-- Verifica
SELECT * FROM "user";

-- 6) Crear tabla post (1–N con user)
CREATE TABLE post (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name      VARCHAR(255),   -- título del post
  content   TEXT,
  user_id   BIGINT NOT NULL,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES "user"(id)
    ON DELETE CASCADE  -- opcional, pero muy útil
);

-- 7) Insertar posts para el usuario id=1
INSERT INTO post (name, content, user_id)
VALUES
  ('Why I love corgis', 'OMG I love them', 1),
  ('Why I love dogs so much', 'Dogs are great in general', 1);

-- 8) Ver posts
SELECT * FROM post;

-- 9) JOIN: traer usuario + sus posts
-- Versión simple (todas las columnas)
SELECT *
FROM "user" u
JOIN post p
  ON p.user_id = u.id;

-- 9.1) JOIN con selección/alias prolijos
SELECT
  u.id           AS user_id,
  u.name         AS user_name,
  u.email        AS user_email,
  p.id           AS post_id,
  p.name         AS title,        -- renombramos 'name' del post a 'title'
  p.content      AS post_content
FROM "user" u
JOIN post p
  ON p.user_id = u.id;

-- 10) Ejemplos WHERE combinados
SELECT p.id, p.name AS title
FROM post p
WHERE p.user_id = 1
  AND p.name ILIKE '%dogs%';  -- ILIKE = case-insensitive
