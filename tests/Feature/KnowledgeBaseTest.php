<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Project;
use App\Models\User;
use App\Services\ArticleImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class KnowledgeBaseTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['kb.ai.api_key' => null]);

        $this->project = Project::create([
            'name' => 'Demo', 'slug' => 'demo', 'is_published' => true,
            'audiences' => [
                ['key' => 'customer', 'label' => 'Pelanggan', 'public' => true],
                ['key' => 'vendor', 'label' => 'Vendor', 'public' => false],
            ],
        ]);

        $importer = app(ArticleImporter::class);
        $importer->importString($this->project, <<<'MD'
---
title: "Cara membayar dengan Virtual Account"
slug: bayar-va
audience: customer
category: "Pembayaran"
tags: ["VA", "transfer"]
---
## Langkah-langkah

1. Pilih **Virtual Account**.
MD);
        $importer->importString($this->project, <<<'MD'
---
title: "Merespons assignment order"
slug: respon-assignment
audience: vendor
category: "Order"
---
Tekan **Terima** untuk menerima assignment.
MD);
    }

    public function test_guest_sees_public_articles_only(): void
    {
        $this->get('/demo/a/bayar-va')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Help/Article')->where('article.title', 'Cara membayar dengan Virtual Account'));

        $this->get('/demo/a/respon-assignment')->assertRedirect('/login');
        $this->get('/demo/untuk/vendor')->assertRedirect('/login');
    }

    public function test_member_with_access_can_read_private_audience(): void
    {
        $member = User::factory()->create();
        $member->projects()->attach($this->project, ['audiences' => json_encode(['vendor'])]);

        $this->actingAs($member)->get('/demo/a/respon-assignment')->assertOk();

        $other = User::factory()->create();
        $this->actingAs($other)->get('/demo/a/respon-assignment')->assertNotFound();
    }

    public function test_search_respects_audience(): void
    {
        $this->get('/demo/cari?q=assignment')
            ->assertInertia(fn (Assert $page) => $page->component('Help/Search')->has('results', 0));

        $this->get('/demo/cari?q=virtual account')
            ->assertInertia(fn (Assert $page) => $page->has('results', 1)->where('results.0.slug', 'bayar-va'));
    }

    public function test_chat_without_ai_key_returns_relevant_sources_and_logs(): void
    {
        $this->postJson('/demo/chat', ['question' => 'gimana bayar pakai VA?'])
            ->assertOk()
            ->assertJsonPath('sources.0.slug', 'bayar-va')
            ->assertJsonPath('error', 'ai_disabled');

        // Pertanyaan pelanggan tidak boleh mengambil artikel vendor.
        $this->postJson('/demo/chat', ['question' => 'assignment order'])
            ->assertOk()
            ->assertJsonCount(0, 'sources');

        $this->assertDatabaseCount('chat_logs', 2);
    }

    public function test_draft_is_hidden_from_public(): void
    {
        Article::where('slug', 'bayar-va')->update(['status' => 'draft']);
        $this->get('/demo/a/bayar-va')->assertNotFound();
    }

    public function test_admin_area_requires_admin(): void
    {
        $this->get('/admin')->assertRedirect('/login');
        $this->actingAs(User::factory()->create())->get('/admin')->assertForbidden();
        $this->actingAs(User::factory()->create(['is_admin' => true]))->get('/admin')->assertOk();
    }

    public function test_admin_can_create_and_update_article(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->post('/admin/projects/demo/articles', [
            'title' => 'Cara login', 'slug' => '', 'audience' => 'customer', 'category_id' => null,
            'body' => '## Langkah\n\n1. Buka aplikasi', 'tags' => ['masuk'], 'platform' => 'all',
            'status' => 'published', 'verification' => 'needs_review', 'review_note' => 'cek nama tombol',
        ])->assertRedirect();

        $article = Article::where('slug', 'cara-login')->firstOrFail();
        $this->assertSame('needs_review', $article->verification);

        $this->actingAs($admin)->put("/admin/projects/demo/articles/{$article->id}", [
            'title' => 'Cara masuk', 'slug' => 'cara-login', 'audience' => 'customer',
            'body' => 'Isi baru', 'platform' => 'web', 'status' => 'published', 'verification' => 'verified',
        ])->assertRedirect();

        $article->refresh();
        $this->assertSame('Cara masuk', $article->title);
        $this->assertNull($article->review_note);
    }

    public function test_project_slug_cannot_use_reserved_words(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->post('/admin/projects', [
            'name' => 'Admin', 'slug' => 'admin', 'audiences' => [['key' => 'umum', 'label' => 'Umum', 'public' => true]],
        ])->assertSessionHasErrors('slug');
    }
}
