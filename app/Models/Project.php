<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name', 'slug', 'tagline', 'description', 'audiences',
        'support_contact', 'color_preset', 'is_published',
    ];

    protected function casts(): array
    {
        return [
            'audiences' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class)->orderBy('position');
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('audiences')->withTimestamps();
    }

    /** @return array<int, string> */
    public function audienceKeys(): array
    {
        return array_column($this->audiences ?? [], 'key');
    }

    public function audienceLabel(string $key): string
    {
        foreach ($this->audiences ?? [] as $a) {
            if ($a['key'] === $key) {
                return $a['label'];
            }
        }

        return ucfirst($key);
    }

    /**
     * Peran yang boleh dibaca: peran publik untuk semua orang, semua peran untuk admin,
     * dan peran yang diberikan lewat keanggotaan project untuk member.
     *
     * @return array<int, string>
     */
    public function visibleAudiences(?User $user): array
    {
        if ($user?->is_admin) {
            return $this->audienceKeys();
        }

        $keys = collect($this->audiences ?? [])->where('public', true)->pluck('key')->all();

        if ($user) {
            $member = $this->members()->whereKey($user->id)->first();
            $keys = array_merge($keys, $member?->pivot->audiences ? json_decode($member->pivot->audiences, true) ?? [] : []);
        }

        return array_values(array_intersect($this->audienceKeys(), array_unique($keys)));
    }
}
