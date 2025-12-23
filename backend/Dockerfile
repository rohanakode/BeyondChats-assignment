# Use the NEWEST PHP version to match your dependencies
FROM php:8.4-apache

# 1. Install system dependencies and MongoDB extension
# This is required because Render's default image doesn't include the MongoDB driver
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    git \
    libcurl4-openssl-dev \
    pkg-config \
    libssl-dev \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && docker-php-ext-install pdo_mysql zip

# Enable Apache mod_rewrite for Laravel routing
RUN a2enmod rewrite

WORKDIR /var/www/html

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy the backend code from your repository into the container
COPY . /var/www/html

# 2. Fix Permissions for Render
# This ensures Laravel can write to logs and the cache folder
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 3. Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Update Apache configuration to point to the Laravel "public" folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# 4. STARTUP COMMAND: Clear memory at runtime, NOT build time.
# This prevents the "Exit Code 1" error by waiting until the server is live
# and can see your Render Environment Variables (like DB_DSN).
CMD php artisan optimize:clear && apache2-foreground

EXPOSE 80