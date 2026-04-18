$projectRoot = Split-Path $PSScriptRoot -Parent
$landingPath = Join-Path $projectRoot 'index.html'
$aboutPath = Join-Path $projectRoot 'about.html'
$projectsPath = Join-Path $projectRoot 'projects.html'
$experiencePath = Join-Path $projectRoot 'experience.html'
$contactPath = Join-Path $projectRoot 'contact.html'
$stylesPath = Join-Path $projectRoot 'assets\styles.css'
$mainScriptPath = Join-Path $projectRoot 'assets\main.js'
$heroScenePath = Join-Path $projectRoot 'assets\hero-scene.js'
$packageJsonPath = Join-Path $projectRoot 'package.json'

foreach ($path in @($landingPath, $aboutPath, $projectsPath, $experiencePath, $contactPath, $stylesPath, $mainScriptPath, $heroScenePath, $packageJsonPath)) {
    if (-not (Test-Path $path -PathType Leaf)) {
        throw "Missing required portfolio file: $path"
    }
}

$landingContent = Get-Content $landingPath -Raw
$aboutContent = Get-Content $aboutPath -Raw
$projectsContent = Get-Content $projectsPath -Raw
$experienceContent = Get-Content $experiencePath -Raw
$contactContent = Get-Content $contactPath -Raw
$stylesContent = Get-Content $stylesPath -Raw
$mainScriptContent = Get-Content $mainScriptPath -Raw
$heroSceneContent = Get-Content $heroScenePath -Raw
$packageJsonContent = Get-Content $packageJsonPath -Raw

foreach ($needle in @(
    'Kelvin Asiedu',
    'Enterprise Technology Integration Student at Penn State',
    'See Projects',
    'See Experience',
    './about.html',
    './projects.html',
    './experience.html',
    './contact.html',
    'id="three-container"',
    './assets/main.js',
    './assets/styles.css'
)) {
    if ($landingContent -notmatch [regex]::Escape($needle)) {
        throw "Missing landing page content: $needle"
    }
}

foreach ($needle in @(
    'PulseCommerce',
    'RAG Chatbot',
    'Bank Account System',
    'Machine Learning Bootcamp',
    'BLK Men in Tech'
)) {
    if ($landingContent -match [regex]::Escape($needle)) {
        throw "Landing page should stay focused and not include text-heavy tab content: $needle"
    }
}

if ($landingContent -notmatch 'class="ui-layer"' -or $landingContent -notmatch 'class="dot-nav"') {
    throw 'Landing page is missing the interactive VANTA shell.'
}

foreach ($page in @(
    @{ Name = 'about'; Content = $aboutContent; Heading = 'About'; Required = @('About Kelvin', 'Enterprise Technology Integration', 'MEP Scholar', 'Machine Learning Bootcamp', 'Kelvinasiedu0807@gmail.com') },
    @{ Name = 'projects'; Content = $projectsContent; Heading = 'Projects'; Required = @('Featured Projects', 'PulseCommerce', 'RAG Chatbot', 'Bank Account System', '450K raw ecommerce events') },
    @{ Name = 'experience'; Content = $experienceContent; Heading = 'Experience'; Required = @('Education & Experience', 'Penn State Derivatives Association', 'BLK Men in Tech', 'Nittany AI Student Society', 'Business Analysis') },
    @{ Name = 'contact'; Content = $contactContent; Heading = 'Contact'; Required = @('Contact', 'Kelvinasiedu0807@gmail.com', 'LinkedIn', 'GitHub', 'Frederick, MD') }
)) {
    foreach ($needle in $page.Required) {
        if ($page.Content -notmatch [regex]::Escape($needle)) {
            throw "Missing $($page.Name) page content: $needle"
        }
    }

    foreach ($needle in @('id="three-container"', 'class="ui-layer"', './assets/main.js')) {
        if ($page.Content -match [regex]::Escape($needle)) {
            throw "$($page.Name) page should not include the landing-only reactive scene: $needle"
        }
    }

    foreach ($needle in @('./about.html', './projects.html', './experience.html', './contact.html')) {
        if ($page.Content -notmatch [regex]::Escape($needle)) {
            throw "$($page.Name) page is missing shared navigation link: $needle"
        }
    }
}

foreach ($content in @($aboutContent, $projectsContent, $experienceContent, $contactContent)) {
    $blankTargetLinks = [regex]::Matches($content, '<a\b[^>]*target="_blank"[^>]*>', 'IgnoreCase')

    foreach ($link in $blankTargetLinks) {
        if ($link.Value -notmatch '\brel\s*=\s*"[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"') {
            throw "External target=_blank link is missing rel=""noopener noreferrer"": $($link.Value)"
        }
    }
}

foreach ($needle in @(
    '.subpage',
    '.subpage-shell',
    '.page-nav',
    '.page-content',
    '.page-section',
    '.profile-glance',
    '@media (prefers-reduced-motion: reduce)',
    '@media (max-width: 768px)',
    '100dvh'
)) {
    if ($stylesContent -notmatch [regex]::Escape($needle)) {
        throw "Missing shared recruiter-first stylesheet behavior: $needle"
    }
}

foreach ($needle in @(
    '.dot-nav',
    'portfolio:request-morph',
    'pointermove'
)) {
    if ($mainScriptContent -notmatch [regex]::Escape($needle)) {
        throw "Missing landing-page interaction behavior: $needle"
    }
}

foreach ($needle in @(
    'PARTICLE_COUNT',
    'sampleGeometry',
    'OrbitControls',
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

Write-Host 'Homepage structure smoke check passed.'
