<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => User::with('projects:id,name')->orderByDesc('is_admin')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Form', ['user' => null, 'projects' => $this->projects()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $user = User::create($data);
        $this->syncAccess($user, $request);

        return redirect()->route('admin.users.index')->with('success', 'Pengguna dibuat.');
    }

    public function edit(User $user): Response
    {
        $user->load('projects:id');

        return Inertia::render('Admin/Users/Form', [
            'user' => [
                ...$user->only('id', 'name', 'email', 'is_admin'),
                'access' => $user->projects->mapWithKeys(fn ($p) => [$p->id => json_decode($p->pivot->audiences, true) ?? []]),
            ],
            'projects' => $this->projects(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $this->validated($request, $user);
        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }
        if ($user->is($request->user())) {
            $data['is_admin'] = true; // jangan sampai admin mencabut aksesnya sendiri
        }
        $user->update($data);
        $this->syncAccess($user, $request);

        return redirect()->route('admin.users.index')->with('success', 'Pengguna disimpan.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            return back()->with('error', 'Anda tidak bisa menghapus akun sendiri.');
        }
        $user->delete();

        return back()->with('success', 'Pengguna dihapus.');
    }

    private function projects()
    {
        return Project::orderBy('name')->get(['id', 'name', 'audiences']);
    }

    private function validated(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users')->ignore($user)],
            'password' => [$user ? 'nullable' : 'required', Password::min(8)],
            'is_admin' => ['boolean'],
            'access' => ['nullable', 'array'],
            'access.*' => ['array'],
            'access.*.*' => ['string', 'max:40'],
        ]);
    }

    private function syncAccess(User $user, Request $request): void
    {
        $sync = [];
        foreach ((array) $request->input('access', []) as $projectId => $audiences) {
            $project = Project::find($projectId);
            $audiences = array_values(array_intersect((array) $audiences, $project?->audienceKeys() ?? []));
            if ($project && $audiences) {
                $sync[$project->id] = ['audiences' => json_encode($audiences)];
            }
        }
        $user->projects()->sync($sync);
    }
}
