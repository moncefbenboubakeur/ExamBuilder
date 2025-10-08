# Agent Delegation Workflows and Communication Patterns

## Core Communication Protocol

### Context Bridge Reality
Sub-agents operate in **isolated contexts** and cannot directly communicate with each other. You serve as the **coordination bridge**, passing information and context between agents.

### Basic Delegation Pattern
```
You → @agent-name → Agent (isolated context) → Returns result to You → You coordinates next steps
```

### Multi-Agent Coordination
```
You → @agent1 → Result1 → You → @agent2 with Result1 context → Result2 → You → Final coordination
```

## Foundation Agent Workflows

### 1. Product Planning Workflow
```
1. You: "@product-manager Plan user notifications feature"
2. Product Manager: Creates feature spec → Returns to you
3. You: "@scrum-master Break down this feature: [paste spec]"
4. Scrum Master: Creates task breakdown → Returns to you
5. You: Delegate to specialists with full context
```

### 2. GDPR Migration Workflow (CRITICAL)
```
1. You: "@product-manager Plan GDPR migration execution"
2. Product Manager: Returns migration plan to you
3. You: "@database-architect Execute migration based on: [paste plan]"
4. Database Architect: Returns migration results to you
5. You: "@gdpr-specialist Validate compliance of: [paste results]"
6. GDPR Specialist: Returns compliance validation to you
7. You: Review all results and make final decisions
```

### 3. Feature Development Workflow
```
1. You: "@product-manager Create feature spec for [feature]"
2. Product Manager: Returns detailed specification to you
3. You: "@scrum-master Break down this feature: [paste spec]"
4. Scrum Master: Returns task breakdown to you
5. You: "@frontend-engineer Build UI for: [paste context]"
6. Frontend Engineer: Returns UI implementation to you
7. You: "@backend-engineer Create API for this UI: [paste UI details]"
8. Backend Engineer: Returns API implementation to you
9. You: "@security-engineer Review implementations: [paste both]"
10. Security Engineer: Returns security validation to you
11. You: Monitor progress and coordinate final integration
```

## Escalation Rules

### Immediate Escalation (to You)
- **Security Issues**: Critical vulnerabilities or breaches
- **GDPR Compliance Failures**: Privacy law violations
- **Production Incidents**: System downtime or data loss
- **Technical Architecture Changes**: Major system modifications

### Daily Escalation
- **Tasks blocked > 4 hours**: Agent unable to proceed
- **Cross-agent coordination failures**: Dependencies not resolved
- **Resource allocation conflicts**: Multiple agents need same resources

### Weekly Escalation
- **Sprint goal risks**: Timeline or deliverable concerns
- **Process improvements**: Workflow optimization suggestions
- **Agent performance issues**: Consistent quality or speed problems

## Quality Gates

### Before Development
- [ ] Product Manager specification complete and approved
- [ ] Security requirements defined by Security Engineer
- [ ] GDPR compliance requirements validated by GDPR Specialist
- [ ] Performance benchmarks established by Performance Engineer

### During Development
- [ ] Code Review Specialist approval on all implementations
- [ ] Security Engineer validation on security-critical features
- [ ] Performance Engineer validation on performance-critical paths
- [ ] GDPR Specialist review on data processing changes

### Before Deployment
- [ ] GDPR Specialist final compliance review
- [ ] DevOps Engineer deployment readiness confirmation
- [ ] Test Engineer comprehensive validation
- [ ] Customer Support user experience validation

## Context Bridging Examples

### Example 1: UI + API Integration
```
You: "@frontend-engineer Create notification bell component for navbar"
Frontend Engineer: Returns component code and requirements

You: "@backend-engineer Create API for notifications based on this UI:
[Frontend Engineer's component requirements and specifications]"
Backend Engineer: Returns API implementation

You: "@security-engineer Review this notification system:
Frontend: [component details]
Backend: [API details]"
Security Engineer: Returns security validation and recommendations
```

### Example 2: Database + Compliance Validation
```
You: "@database-architect Execute GDPR migration step 1: create tables"
Database Architect: Returns SQL execution results and new schema

You: "@gdpr-specialist Validate GDPR compliance of this new schema:
[Database schema and migration results from Database Architect]"
GDPR Specialist: Returns compliance validation with any issues

You: Coordinate resolution of any compliance issues between both agents
```

## Agent Status Reporting Format

### Standard Status Update
```markdown
## Agent Status: [Agent Name] - [Date/Time]

### Current Task:
[Brief description of current work]

### Progress:
- Completed: [What was finished]
- In Progress: [What is being worked on]
- Blocked: [Any blockers or dependencies]

### Next Steps:
[What will be done next]

### Escalation Needed:
[Any issues requiring your attention: Yes/No]
[If yes, specific details and recommendations]
```

### Completion Report Format
```markdown
## Task Completion: [Task Name] - [Agent Name]

### Deliverable:
[What was created/completed]

### Key Outcomes:
- [Specific result 1]
- [Specific result 2]
- [Metrics/measurements if applicable]

### Dependencies/Handoffs:
[What other agents or work depends on this]

### Issues/Risks:
[Any concerns or follow-up needed]

### Recommendations:
[Next steps or improvements suggested]
```

## Agent Interaction Patterns

### Sequential Coordination
Used when one agent's output feeds directly into another's input:
```
Product Manager → Scrum Master → Specialist Agents → Quality Gates → Deployment
```

### Parallel Coordination
Used when multiple agents can work simultaneously:
```
You delegate to:
├── Frontend Engineer (UI work)
├── Backend Engineer (API work)
└── Security Engineer (security review)

Then coordinate integration when all complete.
```

### Review/Validation Coordination
Used for quality assurance across multiple specialties:
```
Primary Agent completes work → You → Review Agents provide feedback → You → Primary Agent addresses feedback
```

## Common Coordination Scenarios

### 1. New Feature Development
```
Product Manager → Scrum Master → 
├── UI/UX Designer (design)
├── Frontend Engineer (implementation)  
├── Backend Engineer (API)
├── Database Architect (schema)
└── Security Engineer (security)
→ Code Review Specialist → Test Engineer → DevOps Engineer
```

### 2. Performance Optimization
```
Performance Engineer (analysis) → 
├── Frontend Engineer (UI optimization)
├── Backend Engineer (API optimization)
└── Database Architect (query optimization)
→ Performance Engineer (validation) → DevOps Engineer (deployment)
```

### 3. Security Issue Resolution
```
Security Engineer (identifies issue) → 
├── Backend Engineer (fix implementation)
├── Frontend Engineer (UI security updates)
└── Database Architect (security policies)
→ Security Engineer (validation) → Code Review Specialist → DevOps Engineer
```

## Success Metrics for Agent Coordination

### Communication Efficiency
- **Context Pass Time**: < 2 minutes between agent handoffs
- **Information Completeness**: 95% of handoffs contain sufficient context
- **Escalation Resolution**: < 4 hours for blocked tasks

### Quality Outcomes
- **First-Pass Approval Rate**: 90% of agent deliverables approved without revision
- **Cross-Agent Integration**: 95% success rate for multi-agent features
- **Compliance Validation**: 100% GDPR and security compliance on first review

### Development Velocity
- **Feature Delivery Time**: 50% reduction through agent coordination
- **Bug Resolution Time**: < 4 hours for critical issues
- **Quality Gate Cycle**: < 2 hours for review processes

## Troubleshooting Agent Coordination

### Agent Not Responding
1. Verify agent was created correctly with `/agents` command
2. Check if task description was clear and specific
3. Ensure agent has necessary context and tool access
4. Try simpler task to test agent functionality

### Poor Agent Output Quality
1. Provide more specific and detailed task descriptions
2. Include relevant context from previous agent work
3. Review agent system prompt for clarity and focus
4. Add examples of expected output format

### Coordination Failures
1. Break down complex multi-agent tasks into smaller steps
2. Ensure proper sequencing of dependent tasks
3. Verify all necessary context is passed between agents
4. Add explicit validation steps at each handoff point

This workflow system enables coordinated 18-agent development while maintaining clear communication patterns and quality standards.