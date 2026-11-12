<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Project;
use App\Services\ArticleImporter;
use App\Services\Markdown;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ArticleController extends Controller
{
    public function index(Request $request, Project $project): Response
    {
        $filters = $request->only('q', 'audience', 'status', 'verification', 'category');

        $articles = $project->articles()->with('category:id,name')
            ->when($filters['q'] ?? null, fn ($q, $s) => $q->where(fn ($w) => $w
                ->where('title', $this->like(), "%{$s}%")->orWhere('slug', $this->like(), "%{$s}%")))
            ->when($filters['audience'] ?? null, fn ($q, $v) => $q->where('audience', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['verification'] ?? null, fn ($q, $v) => $q->where('verification', $v))
            ->when($filters['category'] ?? null, fn ($q, $v) => $q->where('category_id', $v))
            ->orderBy('audience')->orderBy('category_id')->orderBy('position')
            ->paginate(25)->withQueryString()
            ->through(fn (Article $a) => [
                ...$a->only('id', 'title', 'slug', 'audience', 'status', 'verification', 'platform', 'views', 'helpful_yes', 'helpful_no', 'updated_at'),
                'category' => $a->category?->name,
            ]);

        return Inertia::render('Admin/Articles/Index', [
            'project' => $project,
            'articles' => $articles,
            'categories' => $project->categories()->get(['id', 'name', 'audience']),
            'filters' => (object) $filters,
        ]);
    }

    public function create(Project $project): Response
    {
        return Inertia::render('Admin/Articles/Form', [
            'project' => $project,
            'article' => null,
            'categories' => $project->categories()->get(['id', 'name', 'audience']),
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        $article = $project->articles()->create($this->validated($request, $project));

        return redirect()->route('admin.articles.edit', [$project, $article])->with('success', 'Artikel dibuat.');
    }

    public function edit(Project $project, Article $article): Response
    {
        return Inertia::render('Admin/Articles/Form', [
            'project' => $project,
            'article' => $article,
            'categories' => $project->categories()->get(['id', 'name', 'audience']),
        ]);
    }

    public function update(Request $request, Project $project, Article $article): RedirectResponse
    {
        $article->update($this->validated($request, $project, $article));

        return back()->with('success', 'Artikel disimpan.');
    }

    public function destroy(Project $project, Article $article): RedirectResponse
    {
        $article->delete();

        return redirect()->route('admin.articles.index', $project)->with('success', 'Artikel dihapus.');
    }

    public function import(Request $request, Project $project, ArticleImporter $importer): RedirectResponse
    {
        $request->validate([
            'files' => ['required', 'array', 'max:200'],
            'files.*' => ['file', 'max:1024', 'extensions:md,markdown,txt'],
            'status' => ['required', 'in:draft,published'],
        ]);

        $created = $updated = 0;
        $errors = [];
        foreach ($request->file('files') as $file) {
            try {
                $importer->importString($project, $file->get(), $request->input('status')) ? $created++ : $updated++;
            } catch (InvalidArgumentException $e) {
                $errors[] = $file->getClientOriginalName().': '.$e->getMessage();
            }
        }

        $msg = "Impor selesai: {$created} artikel baru, {$updated} diperbarui.";

        return back()->with($errors ? 'error' : 'success', $errors ? $msg.' Gagal: '.implode('; ', $errors) : $msg);
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate(['body' => ['nullable', 'string', 'max:200000']]);

        return response()->json(Markdown::render((string) $request->input('body')));
    }

    private function like(): string
    {
        return DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }

    private function validated(Request $request, Project $project, ?Article $article = null): array
    {
        if (blank($request->input('slug'))) {
            $request->merge(['slug' => Str::slug((string) $request->input('title'))]);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['required', 'alpha_dash', 'max:120', Rule::unique('articles')->where('project_id', $project->id)->ignore($article)],
            'audience' => ['required', Rule::in($project->audienceKeys())],
            'category_id' => ['nullable', Rule::exists('categories', 'id')->where('project_id', $project->id)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string', 'max:200000'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['string', 'max:40'],
            'platform' => ['required', 'in:all,web,mobile'],
            'status' => ['required', 'in:draft,published'],
            'verification' => ['required', 'in:verified,needs_review'],
            'review_note' => ['nullable', 'string', 'max:1000'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);
        $data['position'] = (int) ($data['position'] ?? 0);
        if ($data['verification'] === 'verified') {
            $data['review_note'] = null;
        }

        return $data;
    }
}
