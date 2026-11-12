<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatLog extends Model
{
    protected $fillable = [
        'project_id', 'user_id', 'audience', 'question', 'answer', 'sources', 'answered', 'feedback', 'error',
    ];

    protected function casts(): array
    {
        return ['sources' => 'array', 'answered' => 'boolean'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
