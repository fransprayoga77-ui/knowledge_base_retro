<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Project;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ArticleSearch
{
    private const STOPWORDS = [
        'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'saya', 'aku', 'gue', 'kami', 'kita', 'anda', 'kamu',
        'bagaimana', 'gimana', 'cara', 'apa', 'apakah', 'bisa', 'tidak', 'nggak', 'gak', 'ga', 'ini', 'itu',
        'dengan', 'ada', 'kalau', 'kalo', 'jika', 'mau', 'ingin', 'kok', 'ya', 'dong', 'sih', 'nih', 'deh',
        'adalah', 'atau', 'pada', 'sudah', 'udah', 'tolong', 'mohon', 'bagaimanakah', 'kenapa', 'mengapa',
        'the', 'how', 'to', 'a', 'an', 'is', 'of', 'in', 'and', 'or', 'what',
    ];

    /** @return array<int, string> */
    public static function terms(string $query): array
    {
        preg_match_all('/[\p{L}\p{N}]+/u', mb_strtolower($query), $m);

        return collect($m[0])
            ->filter(fn ($t) => mb_strlen($t) >= 2 && ! in_array($t, self::STOPWORDS, true))
            ->unique()->take(12)->values()->all();
    }

    /**
     * @param  array<int, string>  $audiences
     * @return Collection<int, Article>
     */
    public function search(Project $project, string $query, array $audiences, int $limit = 20): Collection
    {
        $terms = self::terms($query);
        if (! $terms) {
            return collect();
        }

        $base = Article::query()
            ->with('category:id,name,slug')
            ->where('project_id', $project->id)
            ->published()
            ->forAudiences($audiences)
            ->select('articles.*');

        if (DB::getDriverName() === 'pgsql') {
            $tsquery = implode(' | ', array_map(fn ($t) => str_replace("'", '', $t).':*', $terms));

            return $base
                ->selectRaw("ts_rank_cd(search, to_tsquery('simple', ?)) + (CASE WHEN title ILIKE ? THEN 1 ELSE 0 END) AS score", [$tsquery, '%'.$query.'%'])
                ->whereRaw("search @@ to_tsquery('simple', ?)", [$tsquery])
                ->orderByDesc('score')
                ->limit($limit)
                ->get();
        }

        // Fallback MySQL/SQLite: cocokkan setiap kata, urutkan berdasarkan jumlah kecocokan.
        $rows = $base->where(function ($q) use ($terms) {
            foreach ($terms as $t) {
                $q->orWhere('title', 'like', "%{$t}%")->orWhere('body', 'like', "%{$t}%")->orWhere('tags', 'like', "%{$t}%");
            }
        })->limit(200)->get();

        return $rows->map(function (Article $a) use ($terms) {
            $hay = mb_strtolower($a->title.' '.implode(' ', $a->tags ?? []));
            $body = mb_strtolower($a->body);
            $a->score = collect($terms)->sum(fn ($t) => (str_contains($hay, $t) ? 3 : 0) + min(substr_count($body, $t), 3));

            return $a;
        })->sortByDesc('score')->take($limit)->values();
    }
}
