# Troubleshooting

This guide covers common issues you might encounter while developing, deploying, or using RecallPath AI, and how to resolve them.

---

### Fake provider active

**Symptom**: The AI flashcard generation or written-answer evaluation completes instantly, but the answers seem hardcoded or generic.
**Likely cause**: The environment is configured to use the mock AI provider instead of Google Gemini.
**Diagnosis**: Check your `.env` file for the `AI_PROVIDER` variable.
**Solution**: Set `AI_PROVIDER=gemini` in your `.env` file and recreate the backend container explicitly:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate backend
```

---

### Missing Gemini API key

**Symptom**: The backend fails to start, or AI requests immediately return a 500 error.
**Likely cause**: You enabled the Gemini provider but did not supply an API key.
**Diagnosis**: Look at the backend logs (`make logs-backend`). You will likely see a validation error stating `GEMINI_API_KEY is required` or an authentication failure from the Google API.
**Solution**: Obtain an API key from Google AI Studio and add it to your `.env` file as `GEMINI_API_KEY=your_actual_key`. Restart the backend.

---

### Old environment values inside a container

**Symptom**: You changed a value in `.env` (like switching to `gemini`), but the application still behaves as if the old value is active.
**Likely cause**: Docker Compose caches environment variables when containers are created.
**Diagnosis**: Run the following safe command to check exactly which variables the backend container sees (without exposing your real key):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend sh -c '
  echo "AI_PROVIDER=$AI_PROVIDER"
  echo "GEMINI_MODEL=$GEMINI_MODEL"
  if [ -n "$GEMINI_API_KEY" ]; then
    echo "GEMINI_API_KEY=present"
  else
    echo "GEMINI_API_KEY=missing"
  fi
'
```

**Solution**: Force Docker Compose to recreate the container explicitly:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate backend
```

---

### Model unavailable

**Symptom**: AI generation fails with an error indicating the model was not found.
**Likely cause**: Google has deprecated the model specified in `GEMINI_MODEL`, or you made a typo in the `.env` file.
**Diagnosis**: Check the backend logs for a Google API response containing `model not found`.
**Solution**: Update `GEMINI_MODEL` in your `.env` file to a current, valid model (e.g., `gemini-3.5-flash-lite`) and recreate the backend container explicitly:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate backend
```

---

### HTTP 429 (Too Many Requests) and 503 (Service Unavailable)

**Symptom**: Occasional failures when generating flashcards or evaluating written answers. The UI displays an error toaster.
**Likely cause**: You have exceeded the rate limit for your Google Gemini API tier (429), or the Google API is temporarily experiencing downtime (503).
**Diagnosis**: Backend logs will explicitly show `429 Too Many Requests` or `503 Service Unavailable` exceptions.
**Solution**: Do not upgrade to a paid tier for this portfolio project. Instead, simply wait a few minutes before trying again, check your free quotas, or switch temporarily to the `fake` provider. If 503, the issue is on Google's end; retry later.

---

### HTTP 502 caused by invalid AI responses

**Symptom**: A generation run fails (Status: `FAILED`), even though the API key and model are correct.
**Likely cause**: The Gemini API returned a response that did not strictly adhere to the requested JSON schema, causing parsing to fail.
**Diagnosis**: The backend logs will show a JSON parsing error.
**Solution**: This is a known, intermittent issue with LLMs. Simply retrying the generation run usually works.

---

### Evidence validation failures

**Symptom**: The AI returns 0 flashcards or the generation run fails with an internal validation note.
**Likely cause**: The text extracted from the PDF pages did not contain enough factual information for the AI to generate terms without hallucinating.
**Diagnosis**: The generation run status will be `COMPLETED` but with 0 cards, or `FAILED`.
**Solution**: Ensure you are selecting PDF pages that actually contain definitions, glossaries, or clear concepts.

---

### WSL or Docker DNS problems

**Symptom**: The backend container starts but immediately throws `UnknownHostException` when trying to contact Google APIs.
**Likely cause**: The Docker daemon cannot resolve external DNS queries.
**Diagnosis**: Run `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend ping google.com`. If it says "bad address", DNS is broken inside Docker.
**Solution**: Configure Docker to use a public DNS (like `8.8.8.8`) in `/etc/docker/daemon.json`, or restart the Docker service.

---

### Frontend 502 because the backend did not start

**Symptom**: Opening the frontend works, but API requests return a `502 Bad Gateway`.
**Likely cause**: The Vite proxy is trying to forward requests, but the `backend` container crashed or is initializing.
**Diagnosis**: Run `make ps` to check the health status of the backend. Check backend logs for the root cause (`make logs-backend`).
**Solution**: Fix the underlying backend crash (e.g., database password mismatch) and wait for the backend health check to return `UP`. You can verify this inside Docker with:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend curl -fsS http://localhost:8080/actuator/health
```

---

### Container name conflicts

**Symptom**: Running `make dev-up` fails with "Conflict. The container name is already in use...".
**Likely cause**: You previously ran the project using a different directory name or network name.
**Diagnosis**: Run `docker ps -a | grep recallpath` to see conflicting containers.
**Solution**: Remove the conflicting containers manually, or run `make dev-down` to clean up the current project scope.

---

### Maven testCompile failures

**Symptom**: Running tests fails during the compile phase.
**Likely cause**: You modified a backend entity, record, or method signature, but forgot to update the corresponding test files to match the new signature.
**Diagnosis**: The Maven output will highlight `[ERROR] COMPILATION ERROR`.
**Solution**: Open the specified test file and update the code to match the new API contracts. Do not skip tests. You can run tests using:
```bash
cd recallpath-backend
./mvnw test
```
