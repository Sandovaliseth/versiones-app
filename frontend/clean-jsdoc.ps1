$sourceDir = ".\src"
$files = Get-ChildItem -Path $sourceDir -Recurse -Include *.tsx,*.ts

$totalFiles = 0
$totalBlocks = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    $content = $content -replace '/\*\*\s*\n\s*\*\s+[^\n]+\s*\n\s*\*\s+[^\n]+\s*\n\s*\*/', ''
    $content = $content -replace '/\*\*\s*\n\s*\*\s+[^\n]+\s*\n\s*\*/', ''
    
    if ($content -ne $originalContent) {
        $totalFiles++
        $blockCount = ([regex]::Matches($originalContent, '/\*\*\s*\n')).Count
        $totalBlocks += $blockCount
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "OK $($file.Name) - $blockCount bloques JSDoc eliminados" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Limpieza JSDoc completada" -ForegroundColor Cyan
Write-Host "Archivos modificados: $totalFiles" -ForegroundColor Yellow
Write-Host "Bloques JSDoc eliminados: $totalBlocks" -ForegroundColor Yellow
