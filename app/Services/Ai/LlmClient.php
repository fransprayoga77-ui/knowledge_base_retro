<?php

namespace App\Services\Ai;

use Anthropic\Client;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Satu pintu untuk memanggil model bahasa, apa pun providernya. */
class LlmClient
{
    public function __construct(private AiConfig $config) {}

    /**
     * @param  array<int, array{role: string, content: string}>  $messages  percakapan user/assistant
     * @return array{text: string, refused: bool}
     */
    public function chat(string $system, array $messages): array
    {
        return $this->config->driver === 'anthropic'
            ? $this->anthropic($system, $messages)
            : $this->openAiCompatible($system, $messages);
    }

    private function anthropic(string $system, array $messages): array
    {
        $client = new Client(apiKey: $this->config->apiKey);

        $params = [
            'model' => $this->config->model,
            'maxTokens' => $this->config->maxTokens,
            'system' => [
                ['type' => 'text', 'text' => $system, 'cacheControl' => ['type' => 'ephemeral']],
            ],
            'messages' => $messages,
        ];
        // Effort dan fallback server hanya untuk model generasi baru; model lama memakai panggilan biasa.
        if (preg_match('/^claude-(opus|sonnet|haiku|fable)-5/', $this->config->model)) {
            $params['outputConfig'] = ['effort' => $this->config->effort];
            $params['fallbacks'] = 'default'; // bila model menolak karena kebijakan, server mencoba model cadangan
            $params['betas'] = ['server-side-fallback-2026-07-01'];
        }

        $response = $client->beta->messages->create(...$params);

        $text = '';
        foreach ($response->content as $block) {
            if ($block->type === 'text') {
                $text .= $block->text;
            }
        }

        return ['text' => $text, 'refused' => $response->stopReason === 'refusal'];
    }

    private function openAiCompatible(string $system, array $messages): array
    {
        $body = [
            'model' => $this->config->model,
            'messages' => [['role' => 'system', 'content' => $system], ...$messages],
        ];
        // OpenAI memakai max_completion_tokens untuk model barunya; provider lain memakai max_tokens.
        $body[$this->config->provider === 'openai' ? 'max_completion_tokens' : 'max_tokens'] = $this->config->maxTokens;

        $request = Http::timeout(90)->acceptJson()->asJson();
        if ($this->config->apiKey) {
            $request = $request->withToken($this->config->apiKey);
        }
        if ($this->config->provider === 'openrouter') {
            $request = $request->withHeaders(['X-Title' => config('app.name')]);
        }

        $response = $request->post($this->config->baseUrl.'/chat/completions', $body);

        if ($response->failed()) {
            $message = $response->json('error.message') ?? $response->json('message') ?? mb_substr($response->body(), 0, 200);
            throw new RuntimeException("HTTP {$response->status()}: {$message}");
        }

        $choice = $response->json('choices.0');
        if (! $choice) {
            throw new RuntimeException('Respons provider tidak berisi jawaban.');
        }

        $content = $choice['message']['content'] ?? '';
        if (is_array($content)) { // sebagian provider mengembalikan potongan teks
            $content = collect($content)->pluck('text')->filter()->implode('');
        }

        // Beberapa model "reasoning" (mis. GLM, Qwen, DeepSeek R1) menyertakan blok <think> di jawaban.
        $content = trim(preg_replace('#<think>.*?</think>#s', '', (string) $content));

        return ['text' => $content, 'refused' => ($choice['finish_reason'] ?? '') === 'content_filter'];
    }
}
