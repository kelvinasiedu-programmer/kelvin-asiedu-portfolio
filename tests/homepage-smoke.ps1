$projectRoot = Split-Path $PSScriptRoot -Parent
$path = Join-Path $projectRoot 'index.html'
$content = Get-Content $path -Raw
$stylesPath = Join-Path $projectRoot 'assets\styles.css'
$mainScriptPath = Join-Path $projectRoot 'assets\main.js'
$heroScenePath = Join-Path $projectRoot 'assets\hero-scene.js'
$packageJsonPath = Join-Path $projectRoot 'package.json'
$stylesContent = Get-Content $stylesPath -Raw
$mainScriptContent = Get-Content $mainScriptPath -Raw
$heroSceneContent = Get-Content $heroScenePath -Raw
$packageJsonContent = Get-Content $packageJsonPath -Raw

$required = @(
    'Kelvin Asiedu',
    'View Work',
    'About Kelvin',
    './assets/main.js',
    './assets/styles.css',
    'type="module"',
    'id="three-container"',
    'Interface',
    'System',
    'Signal',
    'Flow'
)

foreach ($needle in $required) {
    if ($content -notmatch [regex]::Escape($needle)) {
        if ($needle -in @('./assets/main.js', './assets/styles.css', 'type="module"', 'id="three-container"', 'Interface', 'System', 'Signal', 'Flow')) {
            throw "Missing hero asset or morph label: $needle"
        }

        throw "Missing homepage content: $needle"
    }
}

$vantaShellChecks = @(
    'class="ui-layer"',
    'class="footer"',
    'class="footer-right"',
    'class="dot-nav"',
    'class="nav-idx"',
    'class="morph-progress-bar"',
    'class="morph-progress-fill"',
    'View Collection',
    'How We Think',
    'somewhere between math & magic'
)

foreach ($needle in $vantaShellChecks) {
    if ($content -notmatch [regex]::Escape($needle)) {
        throw "Missing literal VANTA shell detail: $needle"
    }
}

$preservedPortfolioChecks = @(
    'RAG Chatbot',
    'PulseCommerce',
    'Bank Account System',
    'Design Systems',
    'Product Thinking',
    'Front-End Execution',
    'Kelvinasiedu0807@gmail.com',
    'https://www.linkedin.com/in/kelvin-asiedu/',
    'https://github.com/kelvinasiedu-programmer/rag-chatbot-web',
    'https://kelvin-programmer-pulsecommerce.hf.space/',
    'https://kelvin-programmer-bank-account-system.hf.space/'
)

foreach ($needle in $preservedPortfolioChecks) {
    if ($content -notmatch [regex]::Escape($needle)) {
        throw "Missing preserved portfolio content: $needle"
    }
}

$editorialRequired = @(
    'Design Systems',
    'Product Thinking',
    'Front-End Execution',
    'Interface Design',
    'UX Strategy',
    'Front-End Development',
    'Analytics & Systems',
    'RAG Chatbot',
    'PulseCommerce',
    'Bank Account System',
    'Let''s build something intentional.'
)

foreach ($value in $editorialRequired) {
    if ($content -notmatch [regex]::Escape($value)) {
        throw "Missing editorial section content: $value"
    }
}

if ($content -match '<aside(?=[^>]*\bclass="[^"]*\bmorph-info\b[^"]*")(?=[^>]*\baria-live="polite")[^>]*>') {
    throw 'Morph panel should not be exposed as a live region.'
}

if ($content -cnotmatch [regex]::Escape('Kelvinasiedu0807@gmail.com')) {
    throw 'Missing contact email text: Kelvinasiedu0807@gmail.com'
}

$blankTargetLinks = [regex]::Matches($content, '<a\b[^>]*target="_blank"[^>]*>', 'IgnoreCase')

foreach ($link in $blankTargetLinks) {
    if ($link.Value -notmatch '\brel\s*=\s*"[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"') {
        throw "External target=_blank link is missing rel=""noopener noreferrer"": $($link.Value)"
    }
}

foreach ($pattern in @(
    '<section(?=[^>]*\bid="about")(?=[^>]*\baria-labelledby="about-title")[^>]*>',
    '<h2(?=[^>]*\bid="about-title")[^>]*>\s*Designing product experiences with structure, clarity, and taste\.\s*</h2>',
    '<section(?=[^>]*\bid="capabilities")(?=[^>]*\baria-labelledby="capabilities-title")[^>]*>',
    '<h2(?=[^>]*\bid="capabilities-title")[^>]*>\s*Selected strengths across design, code, and systems\.\s*</h2>',
    '<section(?=[^>]*\bid="work")(?=[^>]*\baria-labelledby="work-title")[^>]*>',
    '<h2(?=[^>]*\bid="work-title")[^>]*>\s*Projects where interface, logic, and decision-making meet\.\s*</h2>',
    '<section(?=[^>]*\bid="proof")(?=[^>]*\baria-labelledby="proof-title")[^>]*>',
    '<h2(?=[^>]*\bid="proof-title")[^>]*>\s*Business-minded, technically grounded, design-led\.\s*</h2>',
    '<section(?=[^>]*\bid="contact")(?=[^>]*\baria-labelledby="contact-title")[^>]*>',
    '<h2(?=[^>]*\bid="contact-title")[^>]*>\s*Let''s build something intentional\.\s*</h2>'
)) {
    if ($content -notmatch $pattern) {
        throw "Missing homepage content: $pattern"
    }
}

foreach ($needle in @(
    '.editorial-section.is-visible',
    '@media (prefers-reduced-motion: reduce)',
    '@media (max-width: 768px)',
    '100dvh'
)) {
    if ($stylesContent -notmatch [regex]::Escape($needle)) {
        throw "Missing reveal-safe stylesheet behavior: $needle"
    }
}

foreach ($needle in @(
    'IntersectionObserver',
    'is-visible'
)) {
    if ($mainScriptContent -notmatch [regex]::Escape($needle)) {
        throw "Missing reveal-safe script behavior: $needle"
    }
}

foreach ($needle in @(
    'visibilitychange',
    'cancelAnimationFrame',
    'maxAnimatedDuration'
)) {
    if ($heroSceneContent -notmatch [regex]::Escape($needle)) {
        throw "Missing hero lifecycle protection: $needle"
    }
}

if ($packageJsonContent -notmatch '"runtime-smoke"\s*:') {
    throw 'Missing runtime smoke script in package.json'
}

foreach ($needle in @(
    '.editorial-section.is-pending-reveal',
    'is-pending-reveal'
)) {
    if (
        $stylesContent -match [regex]::Escape($needle) -or
        $mainScriptContent -match [regex]::Escape($needle)
    ) {
        throw "Found hide-first reveal behavior that can flicker: $needle"
    }
}

Write-Host 'Homepage structure smoke check passed.'
