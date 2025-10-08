# DEPLOYMENT AUTHORIZATION RULES - MANDATORY COMPLIANCE

**🚨 CRITICAL DEPLOYMENT VIOLATION PREVENTION PROTOCOL 🚨**

## ABSOLUTE PROHIBITION - NO EXCEPTIONS

### FORBIDDEN OPERATIONS - IMMEDIATE VIOLATION
**NO AGENT** may EVER perform these operations without EXPLICIT USER AUTHORIZATION:

```bash
# ❌ ABSOLUTELY FORBIDDEN WITHOUT USER PERMISSION ❌
git push origin main
git push --force origin main
git push -f origin main
vercel --prod
vercel deploy --prod
gh pr merge --merge
gh pr merge --squash
gh pr merge --rebase
```

### MANDATORY USER AUTHORIZATION REQUIREMENT

**RULE**: Only the USER can authorize production deployments to main branch

**ENFORCEMENT**: ANY agent attempting main branch operations without explicit user instruction commits a CRITICAL VIOLATION

**USER AUTHORIZATION PHRASES** (only these count as valid authorization):
- "deploy to main"
- "push to main branch" 
- "merge to production"
- "deploy to production"
- "push to production"
- "send to main"

**INSUFFICIENT AUTHORIZATION** (these DO NOT authorize main branch operations):
- "deploy the changes"
- "make it live"
- "update the site"
- "commit the code"
- "deploy this"

## MANDATORY DEVELOPMENT WORKFLOW

### PROPER DEVELOPMENT SEQUENCE - ENFORCED
```
1. ALL changes must start on develop branch
2. Test changes in development environment
3. Deploy to staging for user validation
4. WAIT for explicit user authorization
5. ONLY THEN push to main with user permission
```

### BRANCH PROTECTION RULES

**develop branch**: ✅ Safe for agent operations
- Agents can push to develop freely
- Staging deployments from develop allowed
- No user authorization required

**main branch**: 🚨 REQUIRES USER AUTHORIZATION
- NO agent operations without explicit user permission
- ALL main branch pushes require user approval
- Production deployments FORBIDDEN without authorization

## AGENT COMPLIANCE REQUIREMENTS

### BEFORE ANY GIT OPERATION
Every agent MUST check:
1. **Branch Target**: Am I pushing to main?
2. **User Authorization**: Did user explicitly authorize main branch operations?
3. **Workflow Compliance**: Did I follow develop → staging → main sequence?

### MANDATORY WORKFLOW VALIDATION
```bash
# ✅ CORRECT - Agent can do this freely
git checkout develop
git add .
git commit -m "feature implementation"
git push origin develop

# ❌ VIOLATION - Requires explicit user authorization
git checkout main
git push origin main  # ← CRITICAL VIOLATION
```

### DEPLOYMENT AUTHORIZATION CHECK
Before ANY main branch operation, agent must verify:
- [ ] User explicitly requested main branch deployment
- [ ] User used authorized phrases ("deploy to main", "push to main branch", etc.)
- [ ] User provided clear production deployment instruction
- [ ] NOT a general "deploy" or "commit" request

## VIOLATION REPORTING PROTOCOL

### IMMEDIATE ESCALATION REQUIRED
If ANY agent detects deployment violations:
1. **STOP ALL OPERATIONS** immediately
2. **REPORT VIOLATION** to user with full details
3. **DOCUMENT EVIDENCE** of unauthorized deployment attempt
4. **PREVENT CONTINUATION** until user authorization obtained

### VIOLATION DOCUMENTATION FORMAT
```markdown
🚨 DEPLOYMENT VIOLATION DETECTED 🚨

Agent: [agent-name]
Violation: Attempted main branch operation without user authorization
Command: [exact command attempted]
Authorization Status: MISSING - User did not explicitly authorize main branch deployment
Required Action: User must provide explicit authorization using approved phrases
```

## EMERGENCY ROLLBACK PROCEDURES

### IF UNAUTHORIZED DEPLOYMENT OCCURS
1. **IMMEDIATE NOTIFICATION** to user about violation
2. **ROLLBACK PREPARATION** - identify last safe commit
3. **DAMAGE ASSESSMENT** - document what was deployed without authorization
4. **USER DECISION** - wait for user instruction on rollback vs. acceptance

### ROLLBACK COMMANDS (USER AUTHORIZED ONLY)
```bash
# Emergency rollback (ONLY with user permission)
git revert HEAD --no-edit
vercel rollback --token=$VERCEL_TOKEN
```

## AGENT-SPECIFIC ENFORCEMENT

### DevOps Engineer
- **ABSOLUTE PROHIBITION**: NO production deployments without user authorization
- **MANDATORY CHECK**: Verify user explicitly requested main branch operations
- **ESCALATION REQUIRED**: Any production deployment attempt must be user-authorized

### General-Purpose Agent
- **COORDINATION RESPONSIBILITY**: Ensure NO delegated agent violates deployment rules
- **VERIFICATION DUTY**: Confirm user authorization before delegating main branch tasks
- **MONITORING REQUIRED**: Track all agent deployment activities for violations

### ALL Specialized Agents
- **UNIVERSAL REQUIREMENT**: Check deployment authorization before ANY git operations
- **WORKFLOW COMPLIANCE**: Follow develop → staging → main sequence strictly
- **USER PERMISSION**: Never assume deployment authority without explicit authorization

## DEPLOYMENT SAFETY VALIDATION

### PRE-DEPLOYMENT CHECKLIST
Before ANY main branch operation:
- [ ] User explicitly requested main branch deployment using authorized phrases
- [ ] Changes tested on develop branch
- [ ] Staging validation completed (if applicable)
- [ ] User provided clear production deployment instruction
- [ ] NOT responding to general "deploy" or "commit" requests

### SAFE DEPLOYMENT PATTERNS
```bash
# ✅ SAFE - Develop branch operations
git checkout develop
# ... make changes ...
git push origin develop

# ✅ SAFE - Staging deployment from develop
vercel deploy --target staging

# ❌ REQUIRES USER AUTHORIZATION
git checkout main
git merge develop
git push origin main  # ← Only with explicit user permission
```

## IMPLEMENTATION REQUIREMENTS

### ALL AGENTS MUST
1. **IMPLEMENT DEPLOYMENT CHECKS** before ANY git operations
2. **VERIFY USER AUTHORIZATION** for main branch operations
3. **FOLLOW WORKFLOW SEQUENCE** develop → staging → main
4. **REPORT VIOLATIONS** immediately when detected
5. **DOCUMENT AUTHORIZATION** when user provides explicit permission

### MANDATORY AGENT UPDATES
Every agent configuration must include:
- Deployment authorization validation
- Main branch protection rules
- User permission verification
- Violation reporting procedures
- Workflow compliance requirements

---

**ENFORCEMENT LEVEL**: CRITICAL - NO EXCEPTIONS
**VIOLATION CONSEQUENCE**: Immediate escalation and corrective action required
**COMPLIANCE VERIFICATION**: All agents must demonstrate deployment rule adherence
**LAST UPDATED**: August 4, 2025 - Rules Enforcer Implementation