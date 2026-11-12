<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    {{-- Atelier anti-flash: pulihkan tema (terang/gelap) sebelum CSS dimuat --}}
    <script>
        (function () {
            var D = document.documentElement, theme = 'light';
            try { theme = localStorage.getItem('at:theme') || 'light'; } catch (e) {}
            var dark = false;
            try { dark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
            D.setAttribute('data-at-theme', theme === 'system' ? (dark ? 'dark' : 'light') : theme);
            try {
                var preset = localStorage.getItem('at:theme-preset');
                if (preset && preset !== 'atelier') D.setAttribute('data-at-theme-preset', preset);
                if (localStorage.getItem('at:collapsed') === '1') D.setAttribute('data-at-collapsed', 'true');
            } catch (e) {}
        })();
    </script>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700;900&family=Libre+Franklin:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
