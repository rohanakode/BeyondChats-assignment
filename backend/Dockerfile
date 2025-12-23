# Use the NEWEST PHP version to match your dependencies
FROM php:8.4-apache

# 1. Install system dependencies and MongoDB extension
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

# Enable Apache mod_rewrite for Laravel URL routing
RUN a2enmod rewrite

# Set the working directory
WORKDIR /var/www/html

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy the backend code into the container
COPY . /var/www/html

# 2. Set strict permissions for Laravel storage and cache
# This prevents "The stream or file could not be opened" errors
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 3. Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# 4. KILL THE CACHE
# This forces Laravel to forget local settings and use your Render Env Variables
RUN php artisan optimize:clear

# Update Apache configuration to point to public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Expose port 80
EXPOSE 80