#############################
# Stage 1: Build (Poetry) + Wheel
#############################

FROM python:3.13-slim AS builder

WORKDIR /app

COPY pyproject.toml ./

RUN pip install poetry

# Keep original approach (virtualenv in project) for minimal change intent
ENV POETRY_VIRTUALENVS_IN_PROJECT=1

# Install dependencies (no project package yet)
RUN poetry install --only main --no-root || true

# Copy source
COPY src/ ./src

# (Re)install including project (matches original behavior) then build wheel
RUN poetry install --only main 
RUN poetry build -f wheel

#############################
# Stage 2: Runtime (wheel install) with non-root user
#############################

FROM python:3.13-slim AS production

WORKDIR /app

# Copy built wheel from builder and install it (brings deps + package)
COPY --from=builder /app/dist/*.whl /tmp/
RUN pip install /tmp/*.whl && rm /tmp/*.whl

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create minimal non-root user and assign ownership of workdir
RUN useradd -r app && chown -R app:app /app
USER app

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["uvicorn", "dnd_backend.router:app", "--host", "0.0.0.0", "--port", "8000"]
