# Script to refactor pages to use DashboardLayout

$pages = @(
    "Progress.tsx",
    "Practice.tsx",
    "Textbook.tsx",
    "VideoTutorials.tsx",
    "PracticeQuestions.tsx",
    "Flashcards.tsx",
    "Quizzes.tsx",
    "MockQuestions.tsx",
    "AngelAI.tsx",
    "SQETips.tsx",
    "KeyTimeframes.tsx"
)

$pagesDir = "c:\Users\adele\lawangelsfrontend\lawangels\src\pages"

foreach ($page in $pages) {
    $filePath = Join-Path $pagesDir $page
    if (Test-Path $filePath) {
        Write-Host "Processing $page..." -ForegroundColor Cyan
        
        $content = Get-Content $filePath -Raw
        
        # Remove sidebar-related imports
        $content = $content -replace "import \{ [^}]*Menu[^}]*X[^}]* \} from 'lucide-react'", "import"
        $content = $content -replace ",\s*Menu[^,]*,", ","
        $content = $content -replace ",\s*X[^,]*,", ","
        $content = $content -replace ",\s*Home[^,]*,", ","
        $content = $content -replace ",\s*BarChart3[^,]*,", ","
        $content = $content -replace ",\s*HelpCircle as QuestionIcon[^,]*,", ","
        $content = $content -replace ",\s*HelpCircle[^,]*,", ","
        $content = $content -replace ",\s*Brain[^,]*,", ","
        $content = $content -replace ",\s*FileText[^,]*,", ","
        $content = $content -replace ",\s*Bot[^,]*,", ","
        $content = $content -replace ",\s*Lightbulb[^,]*,", ","
        $content = $content -replace "from 'react-router-dom'.*import \{ Link \}", ""
        $content = $content -replace "import \{ Link \} from 'react-router-dom'", ""
        
        # Add DashboardLayout import
        if ($content -notmatch "DashboardLayout") {
            $content = $content -replace "(import.*\} from '\.\./contexts/AuthContext')", "`$1`r`nimport DashboardLayout from '../components/DashboardLayout'"
        }
        
        # Remove logo imports if present
        $content = $content -replace "import logo from '\.\./assets/lawangelslogo\.png'[`r`n]*", ""
        $content = $content -replace "import logotext from '\.\./assets/logotext\.png'[`r`n]*", ""
        
        # Remove sidebar state
        $content = $content -replace "\s+const \[sidebarOpen, setSidebarOpen\] = useState\(true\)[`r`n]", "`r`n"
        
        # Replace main div structure
        $content = $content -replace "return \(`r`n\s+<div className=`"flex h-screen bg-gray-50 font-worksans`">`r`n", "return (`r`n    <DashboardLayout>`r`n"
        
        # Remove sidebar JSX (this is complex, so we'll handle it with a regex pattern)
        $content = $content -replace "(?s){/\* Sidebar \*/}.*?{/\* Main Content \*/}`r`n\s+<div className=`"flex-1 overflow-y-auto`">`r`n", ""
        
        # Replace closing divs
        $content = $content -replace "(?s)</div>`r`n\s+</div>`r`n\s+\)`r`n}", "</DashboardLayout>`r`n  )`r`n}"
        
        # Remove NavItem function
        $content = $content -replace "(?s)function NavItem\(\{.*?\}\)[`r`n]+", ""
        
# Clean up double imports
        $content = $content -replace "import\s+import", "import"
        $content = $content -replace ",\s*,", ","
        
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "Completed $page" -ForegroundColor Green
    } else {
        Write-Host "File not found: $page" -ForegroundColor Red
    }
}

Write-Host "`nAll pages processed!" -ForegroundColor Yellow
