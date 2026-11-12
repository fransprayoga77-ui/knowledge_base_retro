<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    protected $fillable = [
        'project_id', 'category_id', 'audience', 'title', 'slug', 'excerpt', 'body', 'tags',
        'platform', 'status', 'verification', 'review_note', 'position',
    ];

    protected $hidden = ['search'];

    protected function casts(): array
    {
        return ['tags' => 'array'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', 'published');
    }

    /** @param array<int, string> $audiences */
    public function scopeForAudiences(Builder $q, array $audiences): Builder
    {
        return $q->whereIn('audience', $audiences ?: ['__none__']);
    }
}
