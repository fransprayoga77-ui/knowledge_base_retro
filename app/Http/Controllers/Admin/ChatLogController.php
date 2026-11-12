<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatLog;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatLogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only('project', 'answered', 'feedback');

        return Inertia::render('Admin/Chats', [
            'logs' => ChatLog::with('project:id,name,slug')
                ->when($filters['project'] ?? null, fn ($q, $v) => $q->where('project_id', $v))
                ->when(($filters['answered'] ?? '') !== '', fn ($q) => $q->where('answered', $filters['answered'] === '1'))
                ->when($filters['feedback'] ?? null, fn ($q, $v) => $q->where('feedback', $v))
                ->latest()->paginate(20)->withQueryString(),
            'projects' => Project::orderBy('name')->get(['id', 'name']),
            'filters' => (object) $filters,
        ]);
    }
}
