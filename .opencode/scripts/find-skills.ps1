param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string] $Query = "",

    [Parameter(Mandatory = $false)]
    [string] $SkillsPath = "C:\Users\jouwn\.opencode\skills",

    [Parameter(Mandatory = $false)]
    [int] $Top = 8
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SkillsPath)) {
    throw "Skills path not found: $SkillsPath"
}

if ([string]::IsNullOrWhiteSpace($Query)) {
    $Query = Read-Host "Task/query"
}

function Get-SkillMetadata {
    param([System.IO.FileInfo] $File)

    $text = [System.IO.File]::ReadAllText($File.FullName)
    $name = $null
    $description = $null

    if ($text -match '(?m)^name:\s*(.+?)\s*$') {
        $name = $Matches[1].Trim()
    }

    if ($text -match '(?ms)^description:\s*>\s*\r?\n(.+?)\r?\n---') {
        $description = (($Matches[1] -split "`r?`n") | ForEach-Object { $_.Trim() }) -join ' '
    } elseif ($text -match '(?m)^description:\s*(.+?)\s*$') {
        $description = $Matches[1].Trim()
    }

    if ([string]::IsNullOrWhiteSpace($name)) {
        $name = [System.IO.Path]::GetFileNameWithoutExtension($File.Name)
    }

    if ($File.Name -eq 'SKILL.md') {
        $folderName = Split-Path -Leaf $File.DirectoryName
        if ($folderName -and $folderName -ne 'skills') {
            $name = $folderName
        }
    }

    [pscustomobject]@{
        Name = $name
        Description = $description
        Path = $File.FullName
        Text = $text
    }
}

function Get-Tokens {
    param([string] $Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return @()
    }

    $normalized = $Text.ToLowerInvariant() -replace '[^\p{L}\p{Nd}_\.\-/+#]+', ' '
    $stopWords = @(
        'the','and','with','from','this','that','for','into','when','use','using','users','jouwn','desktop','documents',
        'fix','add','make','create','update','change','repair','napraw','dodaj','zrob','zrób','popraw','sprawdz','sprawdź',
        'project','task','code','file','files','folder','app','application'
    )
    $tokens = $normalized -split '\s+' |
        Where-Object { $_.Length -ge 2 -and ($stopWords -notcontains $_) } |
        Select-Object -Unique
    return @($tokens)
}

$skillFiles = Get-ChildItem -LiteralPath $SkillsPath -Recurse -File -Filter '*.md' |
    Where-Object { $_.Name -eq 'SKILL.md' -or $_.DirectoryName -eq $SkillsPath }

$queryTokens = Get-Tokens $Query

$results = foreach ($file in $skillFiles) {
    $skill = Get-SkillMetadata $file
    $descriptionText = if ($null -eq $skill.Description) { '' } else { [string] $skill.Description }
    $nameText = $skill.Name.ToLowerInvariant()
    $descriptionLower = $descriptionText.ToLowerInvariant()
    $contentLower = $skill.Text.ToLowerInvariant()
    $haystack = ($nameText + ' ' + $descriptionLower + ' ' + $contentLower)
    $score = 0
    $matchedTokens = @()

    foreach ($token in $queryTokens) {
        $tokenScore = 0
        if ($nameText -eq $token) { $tokenScore += 12 }
        elseif ($nameText -match "(^|-)$([regex]::Escape($token))($|-)") { $tokenScore += 8 }
        elseif ($nameText.Contains($token)) { $tokenScore += 5 }

        if ($descriptionLower.Contains($token)) { $tokenScore += 3 }
        if ($contentLower.Contains($token)) { $tokenScore += 1 }

        if ($tokenScore -gt 0) {
            $score += $tokenScore
            $matchedTokens += $token
        }
    }

    $phrase = $Query.ToLowerInvariant().Trim()
    if ($phrase.Length -gt 0 -and $haystack.Contains($phrase)) {
        $score += 10
    }

    if ($skill.Name -eq 'skill-router') {
        $score = [Math]::Max(0, $score - 8)
    }

    if ($score -gt 0) {
        [pscustomobject]@{
            Score = $score
            Skill = $skill.Name
            Description = $skill.Description
            Matches = (($matchedTokens | Select-Object -Unique) -join ', ')
            Path = $skill.Path
        }
    }
}

$ranked = @($results | Sort-Object Score, Skill -Descending | Select-Object -First $Top)

if ($ranked.Count -eq 0) {
    "No matching skills found for: $Query"
    exit 0
}

"Query: $Query"
"Suggested skills:"
$ranked | Format-Table -AutoSize Score, Skill, Matches, Description
