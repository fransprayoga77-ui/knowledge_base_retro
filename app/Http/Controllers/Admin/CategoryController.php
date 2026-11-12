<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Project $project): Response
    {
        return Inertia::render('Admin/Categories', [
            'project' => $project,
            'categories' => $project->categories()->withCount('articles')->orderBy('audience')->orderBy('position')->get(),
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        $data = $this->validated($request, $project);
        $project->categories()->create($data + ['slug' => $this->uniqueSlug($project, $data)]);

        return back()->with('success', 'Kategori ditambahkan.');
    }

    public function update(Request $request, Project $project, Category $category): RedirectResponse
    {
        $data = $this->validated($request, $project);
        $category->update($data);

        return back()->with('success', 'Kategori disimpan.');
    }

    public function destroy(Project $project, Category $category): RedirectResponse
    {
        if ($category->articles()->exists()) {
            return back()->with('error', 'Kategori masih berisi artikel. Pindahkan artikelnya dulu.');
        }
        $category->delete();

        return back()->with('success', 'Kategori dihapus.');
    }

    private function validated(Request $request, Project $project): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'audience' => ['required', Rule::in($project->audienceKeys())],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);
        $data['position'] = (int) ($data['position'] ?? 0);

        return $data;
    }

    private function uniqueSlug(Project $project, array $data): string
    {
        $base = Str::slug($data['name']) ?: 'kategori';
        $slug = $base;
        $i = 2;
        while ($project->categories()->where('audience', $data['audience'])->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
