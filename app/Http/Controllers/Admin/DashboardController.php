<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ChatLog;
use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'projects' => Project::count(),
                'articles' => Article::where('status', 'published')->count(),
                'drafts' => Article::where('status', 'draft')->count(),
                'needsReview' => Article::where('verification', 'needs_review')->count(),
                'chats' => ChatLog::count(),
                'unanswered' => ChatLog::where('answered', false)->count(),
            ],
            'projects' => Project::withCount([
                'articles',
                'articles as review_count' => fn ($q) => $q->where('verification', 'needs_review'),
            ])->orderBy('name')->get(['id', 'name', 'slug', 'tagline', 'is_published']),
            'needsReview' => Article::with('project:id,name,slug')->where('verification', 'needs_review')
                ->orderBy('project_id')->orderBy('title')->limit(12)
                ->get(['id', 'project_id', 'title', 'slug', 'review_note']),
            'unanswered' => ChatLog::with('project:id,name,slug')->where('answered', false)
                ->latest()->limit(8)->get(['id', 'project_id', 'question', 'created_at']),
            'topArticles' => Article::with('project:id,name,slug')->orderByDesc('views')->limit(6)
                ->get(['id', 'project_id', 'title', 'slug', 'views', 'helpful_yes', 'helpful_no']),
        ]);
    }
}
