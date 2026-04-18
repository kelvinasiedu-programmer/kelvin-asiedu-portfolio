$projectRoot = Split-Path $PSScriptRoot -Parent
$prefix = 'http://127.0.0.1:4173/'
$session = 'kelvin-portfolio-runtime'
$mimeTypes = @{
    '.css'  = 'text/css; charset=utf-8'
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
}

function Invoke-PlaywrightCli {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]] $Arguments
    )

    & npx --yes --package @playwright/cli playwright-cli @Arguments
}

try {
    $serverJob = Start-Job -ArgumentList $prefix, $projectRoot, $mimeTypes -ScriptBlock {
        param($listenerPrefix, $rootPath, $contentTypes)
        $httpListener = New-Object System.Net.HttpListener
        $httpListener.Prefixes.Add($listenerPrefix)
        $httpListener.Start()
        try {
            while ($httpListener.IsListening) {
                $context = $httpListener.GetContext()
                $relativePath = $context.Request.Url.AbsolutePath.TrimStart('/')

                if ([string]::IsNullOrWhiteSpace($relativePath)) {
                    $relativePath = 'index.html'
                }

                $safePath = $relativePath.Replace('/', '\')
                $filePath = Join-Path $rootPath $safePath
                $response = $context.Response

                if ($relativePath -eq 'favicon.ico') {
                    $response.StatusCode = 204
                    $response.OutputStream.Close()
                    continue
                }

                if (-not (Test-Path $filePath -PathType Leaf)) {
                    $response.StatusCode = 404
                    $response.OutputStream.Close()
                    continue
                }

                $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
                $response.ContentType = $contentTypes[$extension]

                if (-not $response.ContentType) {
                    $response.ContentType = 'application/octet-stream'
                }

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.StatusCode = 200
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.OutputStream.Close()
            }
        } catch [System.Net.HttpListenerException] {
        } finally {
            if ($httpListener.IsListening) {
                $httpListener.Stop()
            }

            $httpListener.Close()
        }
    }

    Start-Sleep -Seconds 1

    Invoke-PlaywrightCli "-s=$session" open $prefix --raw *> $null

    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to open the portfolio homepage in Playwright CLI.'
    }

    Start-Sleep -Seconds 4

    $title = Invoke-PlaywrightCli "-s=$session" eval '(() => document.title)()' --raw

    if ($LASTEXITCODE -ne 0 -or $title.Trim() -notmatch 'Kelvin Asiedu') {
        throw "Runtime smoke could not confirm the homepage title. Saw: $title"
    }

    $hasCanvas = Invoke-PlaywrightCli "-s=$session" eval "(() => Boolean(document.querySelector('#three-container canvas')))()" --raw

    if ($LASTEXITCODE -ne 0 -or $hasCanvas.Trim() -ne 'true') {
        throw 'Runtime smoke could not confirm the hero canvas rendered.'
    }

    $heroBrand = Invoke-PlaywrightCli "-s=$session" eval "(() => document.querySelector('.nav-brand')?.textContent?.trim() ?? '')()" --raw

    if ($LASTEXITCODE -ne 0 -or $heroBrand.Trim() -ne 'Kelvin Asiedu') {
        throw "Runtime smoke could not confirm the VANTA hero brand. Saw: $heroBrand"
    }

    $dotCount = Invoke-PlaywrightCli "-s=$session" eval "(() => document.querySelectorAll('.dot-nav').length)()" --raw

    if ($LASTEXITCODE -ne 0 -or $dotCount.Trim() -ne '4') {
        throw "Runtime smoke expected 4 footer dot controls. Saw: $dotCount"
    }

    $consoleErrors = Invoke-PlaywrightCli "-s=$session" console error --raw

    if ($LASTEXITCODE -ne 0) {
        throw 'Runtime smoke could not inspect browser console output.'
    }

    if (
        -not [string]::IsNullOrWhiteSpace($consoleErrors) -and
        $consoleErrors -notmatch 'Errors:\s*0' -and
        $consoleErrors -notmatch 'favicon\.ico'
    ) {
        throw "Runtime smoke detected browser console errors.`n$consoleErrors"
    }

    Write-Host 'Homepage runtime smoke check passed.'
} finally {
    Invoke-PlaywrightCli "-s=$session" close --raw *> $null

    if ($serverJob) {
        Stop-Job $serverJob -ErrorAction SilentlyContinue *> $null
        Remove-Job $serverJob -Force -ErrorAction SilentlyContinue *> $null
    }
}
