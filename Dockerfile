FROM node:22-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY django_backend/requirements.txt /app/django_backend/requirements.txt
RUN pip install --no-cache-dir -r /app/django_backend/requirements.txt

COPY django_backend /app/django_backend
COPY --from=frontend-build /app/dist /app/dist

RUN mkdir -p /app/django_backend/data
RUN cd /app/django_backend && python manage.py collectstatic --noinput

EXPOSE 8080

CMD ["sh", "-c", "cd /app/django_backend && python manage.py migrate --noinput && gunicorn swiftbookings.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --threads 4 --timeout 120"]
