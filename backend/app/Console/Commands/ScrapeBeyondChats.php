<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Article;
use Symfony\Component\DomCrawler\Crawler;

class ScrapeBeyondChats extends Command
{
    protected $signature = 'scrape:beyondchats';
    protected $description = 'Scrape full content from the last page of BeyondChats';

    public function handle()
    {
        // === THE MAGIC FIX ===
        // This deletes ALL old articles instantly before scraping new ones.
        // No more "Reset" needed!
        $this->warn('Wiping old database...');
        Article::truncate();
        $this->info('Database is clean!');
        
        $this->info('Finding the last page...');
        
        // 1. Get Main Page
        $baseUrl = 'https://beyondchats.com/blogs/';
        $response = Http::withoutVerifying()->get($baseUrl);
        $crawler = new Crawler($response->body());

        $lastPageNode = $crawler->filter('.page-numbers')->last(); 
        $lastPageNum = $lastPageNode->count() ? (int)$lastPageNode->text() : 1;
        
        $targetUrl = "https://beyondchats.com/blogs/page/$lastPageNum/";
        $this->info("Targeting Last Page: $targetUrl");

        // 2. Fetch Target Page
        $pageResponse = Http::withoutVerifying()->get($targetUrl);
        $pageCrawler = new Crawler($pageResponse->body());

        $links = $pageCrawler->filter('article .entry-title a')
            ->each(fn($node) => $node->attr('href'));

        $links = collect($links)->unique()->reverse()->take(5);

        foreach ($links as $link) {
            $this->scrapeSingleArticle($link);
        }

        $this->info('Scraping completed! You can now run the AI worker.');
    }

    private function scrapeSingleArticle($url)
    {
        $this->info("Scraping content: $url");
        $response = Http::withoutVerifying()->get($url);
        
        if (!$response->successful()) return;

        $crawler = new Crawler($response->body());

        $title = $crawler->filter('h1.entry-title')->count() ? $crawler->filter('h1.entry-title')->text() : basename($url);
        $content = $crawler->filter('.entry-content')->count() ? $crawler->filter('.entry-content')->html() : '';

        // Create new clean article
        Article::create([
            'title' => $title,
            'slug' => str()->slug($title),
            'content' => $content, 
            'source_url' => $url,
            'published_at' => now(),
            'version' => 1,
            'ai_content' => null // Ensure AI content starts empty
        ]);
    }
}