<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    private const RESERVED = ['admin', 'login', 'logout', 'up', 'build', 'storage', 'api', 'favicon.svg'];

    public function index(): Response
    {
        return Inertia::render('Admin/Projects/Index', [
            'projects' => Project::withCount(['articles', 'categories', 'members'])->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Projects/Form', ['project' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $project = Project::create($this->validated($request));

        return redirect()->route('admin.articles.index', $project)->with('success', 'Project dibuat. Sekarang tambahkan artikel.');
    }

    public function edit(Project $project): Response
    {
        return Inertia::render('Admin/Projects/Form', ['project' => $project]);
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        $project->update($this->validated($request, $project));

        return redirect()->route('admin.projects.index')->with('success', 'Project disimpan.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        return redirect()->route('admin.projects.index')->with('success', 'Project dihapus beserta seluruh artikelnya.');
    }

    private function validated(Request $request, ?Project $project = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'alpha_dash', 'max:60', Rule::notIn(self::RESERVED), Rule::unique('projects')->ignore($project)],
            'tagline' => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'support_contact' => ['nullable', 'string', 'max:500'],
            'is_published' => ['boolean'],
            'audiences' => ['required', 'array', 'min:1'],
            'audiences.*.key' => ['required', 'alpha_dash', 'max:40', 'distinct'],
            'audiences.*.label' => ['required', 'string', 'max:60'],
            'audiences.*.public' => ['boolean'],
        ], [], ['audiences.*.key' => 'kode peran', 'audiences.*.label' => 'nama peran']);

        $data['slug'] = strtolower($data['slug']);
        $data['audiences'] = array_map(fn ($a) => [
            'key' => strtolower($a['key']), 'label' => $a['label'], 'public' => (bool) ($a['public'] ?? false),
        ], $data['audiences']);

        return $data;
    }
}
