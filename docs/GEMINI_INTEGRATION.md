# Integración con Gemini AI – RecallPath AI

## Descripción

RecallPath AI puede generar tarjetas de estudio usando la API de Google Gemini.
Por defecto, el sistema usa un proveedor _fake_ (sin consumo real) para desarrollo, pruebas y CI.

---

## Proveedor activo

El proveedor se controla con la variable de entorno `AI_PROVIDER`:

| Valor    | Descripción                                      |
|----------|--------------------------------------------------|
| `fake`   | **(Default)** Genera tarjetas de prueba, sin API |
| `gemini` | Generación real con Google Gemini                |

---

## Cómo ejecutar con provider `fake` (sin clave)

```bash
# No se requiere ninguna clave
AI_PROVIDER=fake docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## Cómo obtener y configurar la API key de Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/apikey).
2. Crea un proyecto y genera una API key.
3. Copia la clave en tu archivo `.env` local (nunca al repositorio):

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...tu_clave_aqui...
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_SECONDS=120
GEMINI_MAX_OUTPUT_TOKENS=8192
```

4. Inicia el stack:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build backend
```

> **Advertencia**: La clave nunca se imprime en logs, nunca se devuelve al frontend,
> y nunca debe subirse al repositorio. El fichero `.env` está en `.gitignore`.

---

## Variables de entorno

| Variable                 | Requerida          | Descripción                            |
|--------------------------|--------------------|----------------------------------------|
| `AI_PROVIDER`            | No (default: fake) | `fake` o `gemini`                      |
| `GEMINI_API_KEY`         | Solo si `gemini`   | Clave de Google AI Studio              |
| `GEMINI_MODEL`           | No                 | Modelo a usar (default: gemini-3.5-flash-lite) |
| `GEMINI_TIMEOUT_SECONDS` | No                 | Timeout HTTP en segundos (default: 120) |
| `GEMINI_MAX_OUTPUT_TOKENS`| No                | Tokens máx en la respuesta (default: 8192) |

---

## Cómo cambiar de proveedor

Cambia `AI_PROVIDER` en tu `.env` y reconstruye el backend:

```bash
# Cambiar a Gemini
sed -i 's/AI_PROVIDER=fake/AI_PROVIDER=gemini/' .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build backend

# Volver a fake
sed -i 's/AI_PROVIDER=gemini/AI_PROVIDER=fake/' .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build backend
```

---

## Límites y errores conocidos

| Error                         | Mensaje al usuario                                                     |
|-------------------------------|------------------------------------------------------------------------|
| API key faltante              | "La generación con IA no está configurada."                            |
| Cuota o rate limit            | "El servicio de IA alcanzó temporalmente su límite. Intenta más tarde." |
| Timeout                       | "La generación tardó demasiado. Intenta con menos páginas o menos tarjetas." |
| Respuesta inválida            | "La IA devolvió una respuesta que no pudo validarse. Intenta nuevamente." |
| Error general                 | "No fue posible generar las tarjetas."                                 |

---

## Cómo probar el flujo sin consumir API

1. Asegúrate de que `AI_PROVIDER=fake` (valor por defecto).
2. Sube un PDF, selecciona páginas, elige un conjunto y pulsa "Generar".
3. Las tarjetas generadas serán ficticias pero el flujo completo (revisión, aprobación, práctica) funciona idéntico al real.

---

## Advertencia: documentos confidenciales

> ⚠️ Cuando `AI_PROVIDER=gemini`, el **texto extraído de las páginas seleccionadas**
> se envía a la API de Google Gemini.
> No subas documentos con información confidencial, personal o protegida.
> Consulta la [política de privacidad de Google](https://policies.google.com/privacy) para más detalles.

---

## Arquitectura

- `FlashcardGenerationService` – interfaz que define `generate(context)`
- `FakeFlashcardGenerationService` – implementación de prueba
- `GeminiFlashcardGenerationService` – implementación real con Gemini SDK
- `GenerationProviderConfig` – selecciona el bean activo según `app.ai.provider`
- `GeminiProperties` – vincula `app.ai.gemini.*` con type-safe properties
- La llamada HTTP a Gemini se realiza **fuera de cualquier transacción** para evitar bloquear la base de datos.
