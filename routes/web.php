<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HelpCenterController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [AuthController::class, 'create'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'store'])->middleware(['guest', 'throttle:10,1']);
Route::post('/logout', [AuthController::class, 'destroy'])->name('logout')->middleware('auth');

Route::prefix('admin')->name('admin.')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/', Admin\DashboardController::class)->name('dashboard');
    Route::resource('projects', Admin\ProjectController::class)->except('show');
    Route::get('projects/{project}/articles', [Admin\ArticleController::class, 'index'])->name('articles.index');
    Route::get('projects/{project}/articles/create', [Admin\ArticleController::class, 'create'])->name('articles.create');
    Route::post('projects/{project}/articles', [Admin\ArticleController::class, 'store'])->name('articles.store');
    Route::get('projects/{project}/articles/{article}/edit', [Admin\ArticleController::class, 'edit'])->name('articles.edit')->scopeBindings();
    Route::put('projects/{project}/articles/{article}', [Admin\ArticleController::class, 'update'])->name('articles.update')->scopeBindings();
    Route::delete('projects/{project}/articles/{article}', [Admin\ArticleController::class, 'destroy'])->name('articles.destroy')->scopeBindings();
    Route::post('projects/{project}/import', [Admin\ArticleController::class, 'import'])->name('articles.import');
    Route::post('preview', [Admin\ArticleController::class, 'preview'])->name('articles.preview');
    Route::get('projects/{project}/categories', [Admin\CategoryController::class, 'index'])->name('categories.index');
    Route::post('projects/{project}/categories', [Admin\CategoryController::class, 'store'])->name('categories.store');
    Route::put('projects/{project}/categories/{category}', [Admin\CategoryController::class, 'update'])->name('categories.update')->scopeBindings();
    Route::delete('projects/{project}/categories/{category}', [Admin\CategoryController::class, 'destroy'])->name('categories.destroy')->scopeBindings();
    Route::get('chats', [Admin\ChatLogController::class, 'index'])->name('chats.index');
    Route::get('settings/ai', [Admin\AiSettingsController::class, 'edit'])->name('settings.ai');
    Route::put('settings/ai', [Admin\AiSettingsController::class, 'update'])->name('settings.ai.update');
    Route::post('settings/ai/test', [Admin\AiSettingsController::class, 'test'])->name('settings.ai.test')->middleware('throttle:10,1');
    Route::resource('users', Admin\UserController::class)->except('show');
});

// Pusat bantuan publik (paling bawah agar /{project} tidak menangkap rute lain).
Route::get('/', [HelpCenterController::class, 'index'])->name('home');
Route::get('/{project}', [HelpCenterController::class, 'project'])->name('help.project');
Route::get('/{project}/cari', [HelpCenterController::class, 'search'])->name('help.search');
Route::get('/{project}/untuk/{audience}', [HelpCenterController::class, 'audience'])->name('help.audience');
Route::get('/{project}/a/{slug}', [HelpCenterController::class, 'article'])->name('help.article');
Route::post('/{project}/a/{slug}/feedback', [HelpCenterController::class, 'feedback'])->name('help.feedback')->middleware('throttle:20,1');
Route::post('/{project}/chat', [HelpCenterController::class, 'chat'])->name('help.chat')->middleware('throttle:15,1');
Route::post('/{project}/chat/{chatLog}/feedback', [HelpCenterController::class, 'chatFeedback'])->name('help.chat.feedback')->middleware('throttle:20,1');
