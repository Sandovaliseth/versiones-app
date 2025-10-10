$sourceDir = ".\src"
$files = Get-ChildItem -Path $sourceDir -Recurse -Include *.tsx,*.jsx

$totalFiles = 0
$totalComments = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    $content = $content -replace '\s*\{/\*[^*]*\*/\}\s*', ""
    
    if ($content -ne $originalContent) {
        $totalFiles++
        $commentCount = ([regex]::Matches($originalContent, '\{/\*[^*]*\*/\}')).Count
        $totalComments += $commentCount
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "OK $($file.Name) - $commentCount comentarios eliminados" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Limpieza completada" -ForegroundColor Cyan
Write-Host "Archivos modificados: $totalFiles" -ForegroundColor Yellow
Write-Host "Comentarios eliminados: $totalComments" -ForegroundColor Yellow
