<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Category;
use App\Models\Project;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\Yaml\Yaml;

/**
 * Impor artikel dari file Markdown dengan frontmatter YAML:
 *   title, slug, audience, category, category_order, order, platform,
 *   tags, excerpt, verification, review_note
 * Artikel dengan slug yang sama di project yang sama akan diperbarui.
 */
class ArticleImporter
{
    /** @return array{created: int, updated: int, skipped: array<int, string>} */
    public function importDirectory(Project $project, string $dir, string $status = 'published'): array
    {
        $files = glob(rtrim($dir, '/').'/*.md') ?: [];
        $result = ['created' => 0, 'updated' => 0, 'skipped' => []];

        foreach ($files as $file) {
            if (str_starts_with(basename($file), '_')) {
                continue;
            }
            try {
                $created = $this->importString($project, file_get_contents($file), $status);
                $result[$created ? 'created' : 'updated']++;
            } catch (InvalidArgumentException $e) {
                $result['skipped'][] = basename($file).': '.$e->getMessage();
            }
        }

        return $result;
    }

    /** @return bool true bila artikel baru dibuat */
    public function importString(Project $project, string $content, string $status = 'published'): bool
    {
        if (! preg_match('/^---\s*\n(.*?)\n---\s*\n(.*)$/s', $content, $m)) {
            throw new InvalidArgumentException('frontmatter tidak ditemukan');
        }

        $meta = Yaml::parse($m[1]) ?? [];
        $body = trim($m[2]);

        if (empty($meta['title'])) {
            throw new InvalidArgumentException('title wajib diisi');
        }

        $audience = $meta['audience'] ?? ($project->audienceKeys()[0] ?? 'umum');
        if (! in_array($audience, $project->audienceKeys(), true)) {
            throw new InvalidArgumentException("audience '{$audience}' tidak terdaftar di project");
        }

        $category = null;
        if (! empty($meta['category'])) {
            $category = Category::updateOrCreate(
                ['project_id' => $project->id, 'audience' => $audience, 'slug' => Str::slug($meta['category'])],
                ['name' => $meta['category'], 'position' => (int) ($meta['category_order'] ?? 0)],
            );
        }

        $slug = $meta['slug'] ?? Str::slug($meta['title']);
        $article = Article::firstOrNew(['project_id' => $project->id, 'slug' => $slug]);
        $isNew = ! $article->exists;

        $article->fill([
            'category_id' => $category?->id,
            'audience' => $audience,
            'title' => $meta['title'],
            'excerpt' => $meta['excerpt'] ?? null,
            'body' => $body,
            'tags' => array_values((array) ($meta['tags'] ?? [])),
            'platform' => $meta['platform'] ?? 'all',
            'verification' => $meta['verification'] ?? 'verified',
            'review_note' => ($meta['review_note'] ?? null) ?: null,
            'position' => (int) ($meta['order'] ?? 0),
        ]);
        if ($isNew) {
            $article->status = $status;
        }
        $article->save();

        return $isNew;
    }
}
