<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Setting;
use App\Models\User;
use App\Services\ArticleImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiProviderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['kb.ai.api_key' => null, 'kb.ai.anthropic_key' => null]);

        $project = Project::create([
            'name' => 'Demo', 'slug' => 'demo', 'is_published' => true,
            'audiences' => [['key' => 'customer', 'label' => 'Pelanggan', 'public' => true]],
        ]);
        app(ArticleImporter::class)->importString($project, <<<'MD'
---
title: "Cara membayar dengan Virtual Account"
slug: bayar-va
audience: customer
---
Pilih **Virtual Account** lalu salin nomornya.
MD);
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_admin_can_save_provider_and_key_is_encrypted(): void
    {
        $this->actingAs($this->admin())->put('/admin/settings/ai', [
            'provider' => 'deepseek', 'model' => 'deepseek-chat',
            'base_url' => 'https://api.deepseek.com', 'api_key' => 'sk-rahasia-1234',
        ])->assertRedirect();

        $this->assertSame('deepseek', Setting::get('ai.provider'));
        $this->assertNotSame('sk-rahasia-1234', Setting::query()->find('ai.api_key')->value);
        $this->assertSame('sk-rahasia-1234', Setting::getSecret('ai.api_key'));
    }

    public function test_openai_compatible_provider_answers_with_sources(): void
    {
        Setting::put('ai.provider', 'deepseek');
        Setting::put('ai.model', 'deepseek-chat');
        Setting::put('ai.base_url', 'https://api.deepseek.com');
        Setting::putSecret('ai.api_key', 'sk-test');

        Http::fake([
            'api.deepseek.com/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => "<think>pikir</think>Pilih **Virtual Account** [1]."], 'finish_reason' => 'stop']],
            ]),
        ]);

        $this->postJson('/demo/chat', ['question' => 'cara bayar virtual account'])
            ->assertOk()
            ->assertJsonPath('answered', true)
            ->assertJsonPath('answer', 'Pilih **Virtual Account** [1].')
            ->assertJsonPath('sources.0.slug', 'bayar-va');

        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Bearer sk-test')
            && $r['model'] === 'deepseek-chat'
            && $r['messages'][0]['role'] === 'system'
            && isset($r['max_tokens']));
    }

    public function test_provider_error_is_handled_gracefully(): void
    {
        Setting::put('ai.provider', 'gemini');
        Setting::put('ai.model', 'model-salah');
        Setting::putSecret('ai.api_key', 'kunci');

        Http::fake(['*' => Http::response(['error' => ['message' => 'model not found']], 404)]);

        $this->postJson('/demo/chat', ['question' => 'virtual account'])
            ->assertOk()
            ->assertJsonPath('answered', false)
            ->assertJsonPath('sources.0.slug', 'bayar-va');

        $this->assertStringContainsString('model not found', \App\Models\ChatLog::first()->error);
    }

    public function test_connection_test_endpoint(): void
    {
        Http::fake(['api.openai.com/*' => Http::response(['choices' => [['message' => ['content' => 'Koneksi berhasil']]]])]);

        $this->actingAs($this->admin())->postJson('/admin/settings/ai/test', [
            'provider' => 'openai', 'model' => 'gpt-5-mini', 'base_url' => 'https://api.openai.com/v1', 'api_key' => 'sk-x',
        ])->assertJsonPath('ok', true)->assertJsonPath('message', 'Koneksi berhasil');

        Http::assertSent(fn (Request $r) => isset($r['max_completion_tokens']));
    }
}
