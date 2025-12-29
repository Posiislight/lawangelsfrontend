# PowerShell script to update remaining pages

$pagesDir = "c:\Users\adele\lawangelsfrontend\lawangels\src\pages"
$pages = @("Practice.tsx", "VideoTutorials.tsx", "PracticeQuestions.tsx", "Flashcards.tsx", "Quizzes.tsx", "MockQuestions.tsx", "AngelAI.tsx", "SQETips.tsx", "KeyTimeframes.tsx")

foreach ($page in $pages) {
    $filePath = Join-Path $pagesDir $page
    if (Test-Path $filePath) {
        Write-Host "Processing $page..." -ForegroundColor Cyan
        
        # Read file
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Backup
        $backupPath = $filePath + ".backup"
        Copy-Item $filePath $backupPath -Force
        
        # Replace sidebar open div with DashboardLayout
        $content = $content -replace 'return \(\r?\n\s+<div className="flex h-screen bg-gray-50 font-worksans">', 'return (`r`n    <DashboardLayout>'
        
        # Add DashboardLayout import if not present
        if ($content -notmatch 'DashboardLayout') {
            $content = $content -replace "(import \{ useAuth \} from '\.\./contexts/AuthContext')", "`$1`r`nimport DashboardLayout from '../components/DashboardLayout'"
        }
        
        # Remove sidebarOpen state
        $content = $content -replace '\s+const \[sidebarOpen, setSidebarOpen\] = useState\(true\)\r?\n', "`r`n"
        
        # Remove sidebar-related imports
        $linesToRemove = @('Menu', 'X', 'Home', 'BarChart3', 'HelpCircle as QuestionIcon', 'Brain', 'FileText', 'Bot', 'Lightbulb')
        foreach ($item in $linesToRemove) {
            $content = $content -replace ",\s*$item\s*", ""
        }
        
        # Remove Link import
        $content = $content -replace "import \{ Link \} from 'react-router-dom'\r?\n", ""
        
        # Remove logo imports
        $content = $content -replace "import logo from '\.\./assets/lawangelslogo\.png'\r?\n", ""
        $content = $content -replace "import logotext from '\.\./assets/logotext\.png'\r?\n", ""
        
        Write-Host "Completed $page - Check manually for sidebar JSX removal" -ForegroundColor Yellow
        
        # Save
        Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
    }
}

Write-Host "`nPhase 1 complete! Now manually remove sidebar JSX blocks from each file." -ForegroundColor Green
