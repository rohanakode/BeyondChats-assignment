# Use the official PHP image with Apache
FROM php:8.2-apache

# Install dependencies for Laravel
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql zip

# Enable Apache mod_rewrite for Laravel URL routing
RUN a2enmod rewrite

# Set the working directory
WORKDIR /var/www/html

# Install Composer (PHP Package Manager)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy the backend code into the container
COPY . /var/www/html

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Update Apache configuration to point to public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Expose port 80
EXPOSE 80