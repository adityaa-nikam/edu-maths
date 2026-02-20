# restore-files.ps1
# Run this after switching to dev branch if files go missing
# Usage: .\restore-files.ps1

Write-Host "Restoring files from git HEAD..." -ForegroundColor Cyan

git checkout HEAD -- frontend/src/assets/animations/calculator-loader.json
git checkout HEAD -- frontend/src/dashboard/CreateExamCalendar.css
git checkout HEAD -- frontend/src/dashboard/CreateExamCalendar.jsx
git checkout HEAD -- frontend/src/components/Preloader/Preloader.jsx
git checkout HEAD -- frontend/src/components/Preloader/Preloader.css

Write-Host "Done! All files restored." -ForegroundColor Green
Write-Host ""
Write-Host "Checking files exist:" -ForegroundColor Yellow
Write-Host "  calculator-loader.json : $(Test-Path 'frontend/src/assets/animations/calculator-loader.json')"
Write-Host "  CreateExamCalendar.css : $(Test-Path 'frontend/src/dashboard/CreateExamCalendar.css')"
Write-Host "  Preloader.jsx          : $(Test-Path 'frontend/src/components/Preloader/Preloader.jsx')"
