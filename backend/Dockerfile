#############################
# Stage 1: Build (Poetry)
#############################

FROM python:3.13-slim as builder

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN pip install poetry 

# Force Poetry to create virtual environment in project directory
ENV POETRY_VIRTUALENVS_IN_PROJECT=1 

RUN poetry install --only main --no-root --no-directory

COPY src/ ./src

# Install the package in editable mode to ensure it's importable
RUN poetry install --only main

#############################
# Stage 2: Runtime (static serving)
#############################

FROM python:3.13-slim as production

# Set work directory
WORKDIR /app

# Copy virtual environment from builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy the source code as well (needed for the module to be found)
COPY --from=builder /app/src /app/src

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Activate virtual environment
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src:$PYTHONPATH"

# Expose port
EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Default command
CMD ["uvicorn", "dnd_backend.router:app", "--host", "0.0.0.0", "--port", "8000"]