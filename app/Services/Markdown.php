<?php

namespace App\Services;

use Illuminate\Support\Str;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\MarkdownConverter;

class Markdown
{
    /**
     * Render Markdown ke HTML aman + daftar isi dari heading ## dan ###.
     *
     * @return array{html: string, toc: array<int, array{id: string, text: string, level: int}>}
     */
    public static function render(string $markdown): array
    {
        $environment = new Environment([
            'html_input' => 'escape',
            'allow_unsafe_links' => false,
        ]);
        $environment->addExtension(new CommonMarkCoreExtension);
        $environment->addExtension(new GithubFlavoredMarkdownExtension);

        $html = (string) (new MarkdownConverter($environment))->convert($markdown);

        $toc = [];
        $used = [];
        $html = preg_replace_callback('#<h([23])>(.*?)</h\1>#s', function ($m) use (&$toc, &$used) {
            $text = trim(html_entity_decode(strip_tags($m[2])));
            $id = Str::slug($text) ?: 'bagian';
            $base = $id;
            $i = 2;
            while (isset($used[$id])) {
                $id = $base.'-'.$i++;
            }
            $used[$id] = true;
            $toc[] = ['id' => $id, 'text' => $text, 'level' => (int) $m[1]];

            return "<h{$m[1]} id=\"{$id}\">{$m[2]}</h{$m[1]}>";
        }, $html);

        return ['html' => $html, 'toc' => $toc];
    }

    /** Teks polos untuk konteks AI dan cuplikan. */
    public static function plain(string $markdown): string
    {
        return trim(preg_replace('/\s+/', ' ', strip_tags(self::render($markdown)['html'])));
    }
}
