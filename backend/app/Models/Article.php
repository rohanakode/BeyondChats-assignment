<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Article extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'articles';

    protected $fillable = [
        'title',
        'slug',
        'content',      // Original Scraped Content
        'ai_content',   // <--- Added for Phase 2
        'source_url',
        'published_at',
        'version',
        'references'
    ];
}