<?php

use App\Models\Project;
use App\Services\ArticleImporter;
use Illuminate\Support\Facades\Artisan;

Artisan::command('kb:import {project : slug project} {path : folder berisi file .md} {--draft : simpan artikel baru sebagai draft}', function (ArticleImporter $importer) {
    $project = Project::where('slug', $this->argument('project'))->firstOrFail();
    $r = $importer->importDirectory($project, $this->argument('path'), $this->option('draft') ? 'draft' : 'published');
    $this->info("Dibuat: {$r['created']}, diperbarui: {$r['updated']}");
    foreach ($r['skipped'] as $s) {
        $this->warn("Dilewati: {$s}");
    }
})->purpose('Impor artikel Markdown (dengan frontmatter) ke sebuah project');
