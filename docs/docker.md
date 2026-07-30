# Docker local para RecallPath AI

## Variables

1. Copia `.env.example` a `.env`.
2. Cambia `DB_PASSWORD` y, si usas pgAdmin, `PGADMIN_PASSWORD`.
3. No confirmes `.env`.

Variables principales:

- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: credenciales de PostgreSQL.
- `DB_PORT`: puerto local para PostgreSQL en desarrollo.
- `BACKEND_PORT`: puerto interno del backend.
- `FRONTEND_PORT`: puerto publicado del frontend.
- `APP_CORS_ALLOWED_ORIGINS`: orígenes permitidos cuando frontend y backend se ejecutan por separado.
- `VITE_API_BASE_URL`: URL base usada por el frontend durante desarrollo.
- `VITE_API_PROXY_TARGET`: backend local usado por el proxy de Vite dentro del contenedor frontend.

## Desarrollo local

PostgreSQL en Docker; backend desde IntelliJ o Maven.

```bash
make dev
```

Backend local desde IntelliJ:

- Perfil activo: el default local.
- Puerto: `8080`.
- PostgreSQL host: `localhost`.
- PostgreSQL puerto: el valor real de `DB_PORT` en tu `.env`.
- Variables equivalentes:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:<DB_PORT>/recallpath
SPRING_DATASOURCE_USERNAME=recallpath
SPRING_DATASOURCE_PASSWORD=<tu DB_PASSWORD real de .env>
```

Backend local desde Maven, alternativa a IntelliJ:

```bash
cd recallpath-backend
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:<DB_PORT>/recallpath \
SPRING_DATASOURCE_USERNAME=recallpath \
SPRING_DATASOURCE_PASSWORD=<tu DB_PASSWORD real de .env> \
./mvnw spring-boot:run
```

Frontend local:

```bash
cd recallpath-frontend/land-sales-frontend
npm ci
npm run dev
```

Frontend en contenedor de desarrollo:

```bash
make dev-frontend
```

Abrir:

```text
http://localhost:5173
```

Si `/api/decks` responde `502 Bad Gateway`, Vite no puede alcanzar el backend local. Revisa que IntelliJ tenga Spring Boot corriendo en `http://localhost:8080` y que use la misma contraseña real de PostgreSQL con la que fue inicializado el volumen.

pgAdmin opcional:

```bash
make dev-tools
```

Detener desarrollo sin borrar datos:

```bash
make dev-down
```

## Producción local completa

Construir:

```bash
make prod-build
```

Levantar:

```bash
make prod-up
```

Abrir:

```text
http://localhost:8080
```

Nginx sirve React y reenvía `/api/` al backend interno `backend:8080`. PostgreSQL y backend no publican puertos al host en producción local.

Detener sin borrar el volumen de PostgreSQL:

```bash
make prod-down
```

## Comandos directos equivalentes

```bash
docker compose -f docker-compose.yml config
docker compose -f docker-compose.yml -f docker-compose.dev.yml config
docker compose -f docker-compose.yml -f docker-compose.prod.yml config
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Persistencia y respaldo

PostgreSQL usa el volumen nombrado `recallpath_postgres_data`. No uses `docker compose down -v` salvo que quieras eliminar los datos.

Backup manual:

```bash
mkdir -p backups
docker compose -f docker-compose.yml exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "backups/recallpath-$(date +%Y%m%d-%H%M%S).dump"
```

La restauración reemplaza o mezcla datos según el comando usado; hazla solo con autorización explícita y respaldo preventivo.
