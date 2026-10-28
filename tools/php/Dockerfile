FROM php:8.4-cli-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libpng-dev libjpeg62-turbo-dev libwebp-dev && docker-php-ext-configure gd --with-jpeg --with-webp && docker-php-ext-install -j2 gd exif && rm -rf /var/lib/apt/lists/*
WORKDIR /app
