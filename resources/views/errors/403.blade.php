<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>403 | Apoy</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f6faf9;
            --card: #ffffff;
            --text: #0f172a;
            --muted: #5b6475;
            --line: rgba(15, 23, 42, 0.08);
            --brand: #0f766e;
            --brand-soft: rgba(15, 118, 110, 0.16);
            --shadow: 0 24px 60px -26px rgba(15, 23, 42, 0.34);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
            background:
                radial-gradient(520px 320px at 85% 10%, rgba(56, 189, 248, 0.18), transparent 65%),
                radial-gradient(620px 360px at 10% 5%, rgba(16, 185, 129, 0.2), transparent 70%),
                var(--bg);
            color: var(--text);
        }

        .panel {
            width: min(620px, 100%);
            border: 1px solid var(--line);
            border-radius: 24px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.9) 100%);
            box-shadow: var(--shadow);
            padding: 36px 30px 32px;
            text-align: center;
        }

        .logo-wrap {
            width: 116px;
            height: 116px;
            margin: 0 auto 14px;
            border-radius: 22px;
            background: linear-gradient(145deg, var(--brand-soft), rgba(56, 189, 248, 0.13));
            display: grid;
            place-items: center;
        }

        .logo {
            width: 90px;
            height: 90px;
            object-fit: contain;
            display: block;
        }

        .code {
            margin: 10px 0 0;
            letter-spacing: 0.14em;
            font-size: 12px;
            font-weight: 700;
            color: var(--brand);
        }

        h1 {
            margin: 8px 0 8px;
            font-size: clamp(28px, 4vw, 40px);
            line-height: 1.12;
            font-weight: 800;
        }

        p {
            margin: 0 auto;
            max-width: 46ch;
            color: var(--muted);
            font-size: 15px;
            line-height: 1.65;
        }

        .actions {
            margin-top: 22px;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn {
            appearance: none;
            border: 1px solid transparent;
            border-radius: 12px;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: 0.2s ease;
        }

        .btn-primary {
            background: var(--brand);
            color: #fff;
            box-shadow: 0 12px 28px -16px rgba(15, 118, 110, 0.8);
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            filter: brightness(1.02);
        }

        .btn-ghost {
            border-color: var(--line);
            color: var(--text);
            background: #fff;
        }

        .btn-ghost:hover {
            background: #f8fafc;
        }

        .footer {
            margin-top: 16px;
            font-size: 12px;
            color: #8b94a6;
        }
    </style>
</head>
<body>
    <main class="panel">
        <div class="logo-wrap">
            <img src="{{ asset('apoy-logo.png') }}" alt="Apoy logo" class="logo">
        </div>
        <div class="code">ERROR 403</div>
        <h1>Access denied</h1>
        <p>
            You do not have permission to access this page. If you believe this is incorrect, contact an administrator.
        </p>
        <div class="actions">
            <a class="btn btn-primary" href="javascript:history.back()">Go Back</a>
        </div>
    </main>
</body>
</html>
