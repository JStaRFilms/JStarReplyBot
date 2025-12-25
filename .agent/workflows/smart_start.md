---
description: Intelligent start-of-work workflow that auto-detects context and creates professional issues
---
// turbo-all

# Workflow: Smart Start (Intelligent)

## Usage
User: "/smart_start I want to work on [description]"

## Steps

### 1. Detect Available Script
Check which script exists:
- If `scripts/smart-ops.ps1` exists AND shell is PowerShell → Use `.ps1`
- If `scripts/smart-ops.sh` exists AND shell is Bash/WSL → Use `.sh`
- If both exist → Auto-detect based on current shell environment

### 2. Scan Work (Scripted)
**PowerShell:**
```powershell
.\scripts\smart-ops.ps1 start
```

**Bash:**
```bash
./scripts/smart-ops.sh start
```

### 3. Analyze User Intent
Match user's intent to existing issue/draft, or create NEW.

**If NEW, strictly use the Professional Issue Template:**

---

## Title
[Feature/Bug] Clear, concise summary

## Labels
enhancement, bug, [module-name], priority:high

## User Story
As a [user type], I want to [action], so that [benefit].

## Root Cause / Proposed Solution
*(This is the "Plan-and-Solve" part — critical for actionable issues)*

**For Features:** Describe the implementation approach:
- Key components/files to create or modify
- Data flow and architecture decisions
- Dependencies or prerequisites

**For Bugs:** Describe the technical root cause and fix:
- What is causing the issue (not just symptoms)
- The specific code path or logic flaw
- The proposed fix with file paths

## Estimated Duration
[X] days (Target: YYYY-MM-DD)

## Acceptance Criteria
- [ ] Testable outcome 1
- [ ] Testable outcome 2
- [ ] Testable outcome 3

---

### 4. Time Estimation
Ask user: "How long will this take?" and set target date accordingly.

### 5. Execution
**PowerShell:**
```powershell
.\scripts\smart-ops.ps1 create "Title" "Body" "labels" [days]
```

**Bash:**
```bash
./scripts/smart-ops.sh create "Title" "Body" "labels" [days]
```

### 6. Confirmation
Tell the user:
- ✅ Issue #XX created
- 📅 Start date: YYYY-MM-DD (today)
- 🎯 Target date: YYYY-MM-DD
