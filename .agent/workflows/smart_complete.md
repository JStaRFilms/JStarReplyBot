---
description: Intelligent end-of-work workflow that auto-detects what you completed
---
// turbo-all

# Workflow: Smart Complete (Intelligent)

## Usage
User: "/smart_complete I finished [description]"

## Steps

### 1. Scan Completion Candidates (Scripted)
**PowerShell:**
```powershell
.\scripts\smart-ops.ps1 complete
```

**Bash:**
```bash
./scripts/smart-ops.sh complete
```

### 2. Match Work to Issues
Match user's completed work description to active issues:
- **If exact match found:** Proceed to close
- **If partial match:** Ask for clarification
- **If no match:** Ask user to specify issue number

### 3. Duration Tracking
Calculate actual duration vs estimated:
- **Start Date:** When issue was created/started
- **Target Date:** The original estimate
- **Completion Date:** Today

Report variance:
- ⏱️ **Early:** Completed X days ahead of target
- ✅ **On-time:** Completed on target date
- ⚠️ **Late:** Completed X days after target

### 4. Execution
**PowerShell:**
```powershell
.\scripts\smart-ops.ps1 close [number] "Completed in X days (estimated: Y days)"
```

**Bash:**
```bash
./scripts/smart-ops.sh close [number] "Completed in X days (estimated: Y days)"
```

### 5. Project Board Cleanup (If applicable)
If using GitHub Projects, also move the item to Done:
**PowerShell:**
```powershell
.\scripts\smart-ops.ps1 done [item_id]
```

**Bash:**
```bash
./scripts/smart-ops.sh done [item_id]
```

### 6. Confirmation
Tell the user:
- ✅ Issue #XX closed
- 📅 Started: YYYY-MM-DD
- 🏁 Completed: YYYY-MM-DD
- ⏱️ Duration: X days (Target was Y days)
