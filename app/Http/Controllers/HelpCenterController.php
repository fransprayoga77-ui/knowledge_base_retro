<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Models\ChatLog;
use App\Models\Project;
use App\Services\ArticleSearch;
use App\Services\ChatAssistant;
use App\Services\Markdown;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HelpCenterController extends Controller
{
    public function index(Request $request): Response
    {
        $projects = Project::query()
            ->when(! $request->user()?->is_admin, fn ($q) => $q->where('is_published', true))
            ->orderBy('name')
            ->get()
            ->map(fn (Project $p) => [
                ...$this->projectProps($p, $request),
                'article_count' => $p->articles()->published()->forAudiences($p->visibleAudiences($request->user()))->count(),
            ]);

        return Inertia::render('Help/Index', ['projects' => $projects]);
    }

    public function project(Request $request, Project $project): Response
    {
        $this->ensureVisible($request, $project);
        $audiences = $project->visibleAudiences($request->user());

        $groups = collect($audiences)->map(fn (string $key) => [
            'key' => $key,
            'label' => $project->audienceLabel($key),
            'categories' => $this->categoriesFor($project, $key, 4),
        ]);

        $popular = Article::where('project_id', $project->id)->published()->forAudiences($audiences)
            ->orderByDesc('views')->orderBy('position')->limit(6)->get(['id', 'title', 'slug', 'excerpt', 'audience']);

        return Inertia::render('Help/Project', [
            'project' => $this->projectProps($project, $request),
            'groups' => $groups,
            'popular' => $popular,
            'hiddenAudiences' => $this->hiddenAudiences($project, $audiences),
        ]);
    }

    public function audience(Request $request, Project $project, string $audience): Response
    {
        $this->ensureVisible($request, $project);
        $this->ensureAudience($request, $project, $audience);

        return Inertia::render('Help/Audience', [
            'project' => $this->projectProps($project, $request),
            'audience' => ['key' => $audience, 'label' => $project->audienceLabel($audience)],
            'categories' => $this->categoriesFor($project, $audience),
        ]);
    }

    public function article(Request $request, Project $project, string $slug): Response
    {
        $this->ensureVisible($request, $project);
        $article = Article::where('project_id', $project->id)->where('slug', $slug)->with('category')->firstOrFail();

        abort_if($article->status !== 'published' && ! $request->user()?->is_admin, 404);
        $this->ensureAudience($request, $project, $article->audience);

        if ($article->status === 'published') {
            $article->increment('views');
        }

        $rendered = Markdown::render($article->body);
        $siblings = $article->category_id
            ? Article::where('category_id', $article->category_id)->published()->orderBy('position')->get(['id', 'title', 'slug'])
            : collect();

        return Inertia::render('Help/Article', [
            'project' => $this->projectProps($project, $request),
            'article' => [
                ...$article->only('id', 'title', 'slug', 'excerpt', 'tags', 'platform', 'status', 'verification', 'updated_at'),
                'audience' => ['key' => $article->audience, 'label' => $project->audienceLabel($article->audience)],
                'category' => $article->category?->only('id', 'name', 'slug'),
                'html' => $rendered['html'],
                'toc' => $rendered['toc'],
            ],
            'siblings' => $siblings,
        ]);
    }

    public function search(Request $request, Project $project, ArticleSearch $search): Response
    {
        $this->ensureVisible($request, $project);
        $q = trim((string) $request->query('q', ''));
        $audiences = $project->visibleAudiences($request->user());
        $filter = $request->query('untuk');
        if ($filter && in_array($filter, $audiences, true)) {
            $audiences = [$filter];
        }

        $results = $q === '' ? collect() : $search->search($project, $q, $audiences, 30)->map(fn (Article $a) => [
            'id' => $a->id,
            'title' => $a->title,
            'slug' => $a->slug,
            'excerpt' => $a->excerpt,
            'audience' => $project->audienceLabel($a->audience),
            'category' => $a->category?->name,
        ]);

        return Inertia::render('Help/Search', [
            'project' => $this->projectProps($project, $request),
            'q' => $q,
            'filter' => $filter,
            'results' => $results,
        ]);
    }

    public function feedback(Request $request, Project $project, string $slug): JsonResponse
    {
        $data = $request->validate(['helpful' => ['required', 'boolean']]);
        $article = Article::where('project_id', $project->id)->where('slug', $slug)->published()->firstOrFail();
        $article->increment($data['helpful'] ? 'helpful_yes' : 'helpful_no');

        return response()->json(['ok' => true]);
    }

    public function chat(Request $request, Project $project, ChatAssistant $assistant): JsonResponse
    {
        $this->ensureVisible($request, $project);
        $data = $request->validate([
            'question' => ['required', 'string', 'max:1000'],
            'audience' => ['nullable', 'string'],
            'history' => ['nullable', 'array', 'max:12'],
            'history.*.role' => ['required', 'in:user,assistant'],
            'history.*.content' => ['required', 'string', 'max:4000'],
        ]);

        $audiences = $project->visibleAudiences($request->user());
        if (! empty($data['audience']) && in_array($data['audience'], $audiences, true)) {
            $audiences = [$data['audience']];
        }

        $result = $assistant->ask($project, $data['question'], $audiences, $data['history'] ?? []);

        $log = ChatLog::create([
            'project_id' => $project->id,
            'user_id' => $request->user()?->id,
            'audience' => count($audiences) === 1 ? $audiences[0] : null,
            'question' => $data['question'],
            'answer' => $result['answer'],
            'sources' => $result['sources'],
            'answered' => $result['answered'],
            'error' => $result['error'],
        ]);

        // Render jawaban (Markdown) ke HTML aman, dan ubah penanda [n] jadi tautan ke artikel sumber.
        $bySource = collect($result['sources'])->keyBy('n');
        $html = preg_replace_callback('/\[(\d+)\]/', function ($m) use ($bySource, $project) {
            $src = $bySource->get((int) $m[1]);

            return $src
                ? '<a class="kb-cite" href="'.e(route('help.article', [$project, $src['slug']], false)).'" title="'.e($src['title']).'">'.$m[1].'</a>'
                : '';
        }, Markdown::render($result['answer'])['html']);

        return response()->json([...$result, 'html' => $html, 'id' => $log->id]);
    }

    public function chatFeedback(Request $request, Project $project, ChatLog $chatLog): JsonResponse
    {
        abort_unless($chatLog->project_id === $project->id, 404);
        $data = $request->validate(['feedback' => ['required', 'in:up,down']]);
        $chatLog->update(['feedback' => $data['feedback']]);

        return response()->json(['ok' => true]);
    }

    /* ---------- helpers ---------- */

    private function ensureVisible(Request $request, Project $project): void
    {
        abort_if(! $project->is_published && ! $request->user()?->is_admin, 404);
    }

    private function ensureAudience(Request $request, Project $project, string $audience): void
    {
        if (in_array($audience, $project->visibleAudiences($request->user()), true)) {
            return;
        }
        if (! $request->user() && in_array($audience, $project->audienceKeys(), true)) {
            abort(redirect()->guest(route('login')));
        }
        abort(404);
    }

    /** @return array<string, mixed> */
    private function projectProps(Project $project, Request $request): array
    {
        $visible = $project->visibleAudiences($request->user());

        return [
            ...$project->only('id', 'name', 'slug', 'tagline', 'description', 'support_contact', 'color_preset'),
            'audiences' => collect($project->audiences)->whereIn('key', $visible)->values(),
        ];
    }

    /** @param array<int, string> $visible */
    private function hiddenAudiences(Project $project, array $visible): array
    {
        return collect($project->audiences)->whereNotIn('key', $visible)->pluck('label')->values()->all();
    }

    private function categoriesFor(Project $project, string $audience, ?int $perCategory = null)
    {
        return Category::where('project_id', $project->id)->where('audience', $audience)
            ->orderBy('position')
            ->with(['articles' => fn ($q) => $q->published()->select('id', 'category_id', 'title', 'slug', 'excerpt', 'position')])
            ->get()
            ->filter(fn (Category $c) => $c->articles->isNotEmpty())
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'count' => $c->articles->count(),
                'articles' => $perCategory ? $c->articles->take($perCategory)->values() : $c->articles->values(),
            ])->values();
    }
}
