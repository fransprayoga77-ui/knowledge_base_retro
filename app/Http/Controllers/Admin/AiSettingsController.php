<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\Ai\AiConfig;
use App\Services\Ai\LlmClient;
use App\Services\Ai\Providers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AiSettingsController extends Controller
{
    public function edit(): Response
    {
        $config = AiConfig::current();
        $key = $config->apiKey;

        return Inertia::render('Admin/AiSettings', [
            'providers' => Providers::LIST,
            'current' => [
                'provider' => $config->provider,
                'model' => $config->model,
                'base_url' => $config->baseUrl,
                'effort' => $config->effort,
                'has_key' => filled($key),
                'key_hint' => $key ? '••••'.mb_substr($key, -4) : null,
                'key_from_env' => filled($key) && ! Setting::get('ai.api_key'),
                'enabled' => $config->enabled(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        Setting::put('ai.provider', $data['provider']);
        Setting::put('ai.model', $data['model']);
        Setting::put('ai.base_url', $data['base_url'] ?? null);
        Setting::put('ai.effort', $data['effort'] ?? 'low');
        if ($request->boolean('clear_key')) {
            Setting::putSecret('ai.api_key', null);
        } elseif (filled($data['api_key'] ?? null)) {
            Setting::putSecret('ai.api_key', $data['api_key']);
        }

        return back()->with('success', 'Pengaturan AI disimpan. Aktif: '.AiConfig::current()->label());
    }

    /** Kirim pertanyaan uji singkat dengan isian formulir (belum disimpan). */
    public function test(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $preset = Providers::get($data['provider']);
        $current = AiConfig::current();

        $config = new AiConfig(
            provider: $data['provider'],
            driver: $preset['driver'],
            model: $data['model'],
            apiKey: filled($data['api_key'] ?? null) ? $data['api_key'] : ($request->boolean('clear_key') ? null : $current->apiKey),
            baseUrl: rtrim((string) ($data['base_url'] ?? ''), '/') ?: null,
            effort: $data['effort'] ?? 'low',
            maxTokens: 200,
        );

        if (! $config->enabled()) {
            return response()->json(['ok' => false, 'message' => 'Lengkapi model, base URL, dan API key terlebih dahulu.']);
        }

        $started = microtime(true);
        try {
            $result = (new LlmClient($config))->chat(
                'Anda sedang diuji koneksinya. Jawab singkat dalam Bahasa Indonesia.',
                [['role' => 'user', 'content' => 'Balas persis dengan: Koneksi berhasil']],
            );

            return response()->json([
                'ok' => true,
                'message' => trim($result['text']) ?: '(jawaban kosong)',
                'ms' => (int) ((microtime(true) - $started) * 1000),
            ]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => mb_substr($e->getMessage(), 0, 400)]);
        }
    }

    private function validated(Request $request): array
    {
        $provider = Providers::get((string) $request->input('provider'));

        return $request->validate([
            'provider' => ['required', Rule::in(array_keys(Providers::LIST))],
            'model' => ['required', 'string', 'max:120'],
            'base_url' => [$provider && $provider['driver'] === 'openai' ? 'required' : 'nullable', 'nullable', 'url', 'max:255'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'effort' => ['nullable', 'in:low,medium,high'],
        ], [], ['model' => 'nama model', 'base_url' => 'base URL']);
    }
}
