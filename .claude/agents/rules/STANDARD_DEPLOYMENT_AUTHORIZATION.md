# Standard Deployment Authorization Block for All Agents

This is the standardized deployment authorization language that must be added to ALL agent configurations to prevent unauthorized main branch deployments.

## Standard Block to Add to ALL Agents

```markdown
**🚨 MANDATORY DEPLOYMENT AUTHORIZATION - CRITICAL VIOLATION PREVENTION 🚨**:
- **ABSOLUTE PROHIBITION**: NEVER perform git operations on main branch without EXPLICIT USER AUTHORIZATION
- **FORBIDDEN COMMANDS**: `git push origin main`, `git merge main`, `git checkout main && git push`, ANY production deployments
- **USER AUTHORIZATION REQUIRED**: User must explicitly say "deploy to main", "push to main branch", or "deploy to production"
- **WORKFLOW ENFORCEMENT**: ALL changes must go through develop → staging → user approval → ONLY THEN main branch
- **VIOLATION REPORTING**: Immediately escalate ANY unauthorized main branch operation attempts to user

**DEPLOYMENT AUTHORIZATION VALIDATION**: Before ANY git operations, verify:
1. **Target Branch Check**: Are you operating on main branch? If YES, user authorization required.
2. **User Permission Verification**: Did user explicitly authorize main branch operations using approved phrases?
3. **Workflow Compliance**: Have you followed proper develop → staging → approval sequence?
4. **Safe Operations**: develop branch operations require NO authorization, main branch operations ALWAYS require user authorization.
```

## Implementation Status

### Core Agents (COMPLETED)
- ✅ devops-engineer.md - Comprehensive deployment rules implemented
- ✅ general-purpose.md - Coordination protocols updated with deployment safety

### Critical Agents (COMPLETED ✅)
- ✅ backend-engineer.md - Deployment authorization rules implemented
- ✅ frontend-engineer.md - Deployment authorization rules implemented
- ✅ database-architect.md - Deployment authorization rules implemented
- ✅ security-engineer.md - Deployment authorization rules implemented

### Supporting Agents (COMPLETED ✅)
- ✅ code-reviewer.md - Deployment authorization rules implemented
- ✅ test-engineer.md - Deployment authorization rules implemented
- ✅ performance-engineer.md - Deployment authorization rules implemented
- ✅ analytics-engineer.md - Deployment authorization rules implemented

### Previously Deployment-Safe Agents (NOW COMPLETED ✅)
- ✅ customer-support.md - Deployment authorization rules implemented
- ✅ legal-compliance.md - Deployment authorization rules implemented
- ✅ growth-specialist.md - Deployment authorization rules implemented
- ✅ product-manager.md - Deployment authorization rules implemented
- ✅ scrum-master.md - Deployment authorization rules implemented
- ✅ gdpr-specialist.md - Deployment authorization rules implemented
- ✅ seo-specialist.md - Deployment authorization rules implemented
- ✅ technical-writer.md - Deployment authorization rules implemented
- ✅ ui-designer.md - Deployment authorization rules implemented
- ✅ rules-enforcer.md - Deployment authorization rules implemented

## Verification Checklist

For each agent, ensure:
- [ ] Standard deployment authorization block added at top of file
- [ ] Agent-specific deployment restrictions documented
- [ ] Clear workflow compliance requirements stated
- [ ] Violation reporting procedures included
- [ ] Safe vs. unsafe operations clearly distinguished