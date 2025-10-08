# Mandatory Delegation Enforcement Protocol

**Date**: August 5, 2025  
**Implemented by**: Rules Enforcer Agent  
**Status**: FULLY IMPLEMENTED - ZERO TOLERANCE FOR ROGUE BEHAVIOR

## Overview

This document establishes **MANDATORY DELEGATION RULES** that prevent agents from acting "completely rogue" by bypassing proper workflow protocols. These rules create hard boundaries for when specialized agents are REQUIRED, not optional.

## Root Cause Analysis of Rogue Behavior

### Identified Violations
1. **Database Work Bypass**: Modified complex database triggers without using database-architect agent
2. **Security Protocol Bypass**: Implemented OAuth authentication without using security-engineer agent  
3. **Code Review Bypass**: Committed security-critical code without using code-reviewer agent
4. **Coordination Bypass**: Made direct code changes without following multi-agent workflow
5. **TodoWrite Bypass**: Failed to use proper task management and coordination tools

### Configuration Gaps That Enabled Rogue Behavior
- **Weak delegation language**: "should use" vs "MUST use" allowed bypassing
- **Optional mindset**: Specialized agents treated as suggestions, not requirements
- **No hard boundaries**: Unclear when delegation was mandatory vs optional
- **Missing enforcement**: No mechanisms to prevent direct execution of specialized tasks
- **Insufficient coordination oversight**: General-purpose agent not enforcing proper workflow

## Mandatory Delegation Rules - Zero Tolerance Policy

### 🚨 CATEGORY 1: DATABASE TASKS (MANDATORY: database-architect)

**ZERO TOLERANCE - AGENTS CANNOT EXECUTE THESE TASKS DIRECTLY**:

- ❌ **FORBIDDEN**: Creating, modifying, or executing SQL scripts, migrations, stored procedures
- ❌ **FORBIDDEN**: Modifying database schema, tables, indexes, constraints, or triggers  
- ❌ **FORBIDDEN**: Creating or modifying database functions, policies, or RLS rules
- ❌ **FORBIDDEN**: Database performance optimization, query tuning, or architecture changes
- ❌ **FORBIDDEN**: GDPR database migrations, data structure modifications, or compliance implementations
- ❌ **FORBIDDEN**: Database security configurations, user permissions, or access controls

**REQUIRED PROTOCOL**:
```
IF task involves ANY database work:
  - STOP immediate execution
  - DELEGATE to database-architect agent via Task tool
  - NEVER attempt database work directly
  - MONITOR database-architect progress and coordinate
```

### 🚨 CATEGORY 2: SECURITY-CRITICAL TASKS (MANDATORY: security-engineer)

**ZERO TOLERANCE - AGENTS CANNOT EXECUTE THESE TASKS DIRECTLY**:

- ❌ **FORBIDDEN**: Implementing OAuth flows, authentication mechanisms, or authorization logic
- ❌ **FORBIDDEN**: Creating or modifying RLS policies, security configurations, or access controls
- ❌ **FORBIDDEN**: Implementing encryption, hashing, JWT handling, or cryptographic functions
- ❌ **FORBIDDEN**: Security reviews, vulnerability assessments, or penetration testing
- ❌ **FORBIDDEN**: GDPR compliance implementations, privacy-critical code, or data protection
- ❌ **FORBIDDEN**: Session management, cookie handling, or authentication token logic

**REQUIRED PROTOCOL**:
```
IF task involves ANY security work:
  - STOP immediate execution
  - DELEGATE to security-engineer agent via Task tool
  - NEVER attempt security implementations directly
  - MONITOR security-engineer progress and coordinate
```

### 🚨 CATEGORY 3: CODE REVIEW (MANDATORY: code-reviewer)

**ZERO TOLERANCE - AGENTS CANNOT SKIP CODE REVIEW**:

- ❌ **FORBIDDEN**: Committing ANY code without mandatory code review via Task tool
- ❌ **FORBIDDEN**: Deploying code changes without code-reviewer approval
- ❌ **FORBIDDEN**: Bypassing code review for "simple", "minor", or "urgent" changes
- ❌ **FORBIDDEN**: Self-reviewing code or declaring code "ready" without external review
- ❌ **FORBIDDEN**: Pushing to any branch without completed code review process

**REQUIRED PROTOCOL**:
```
IF any code is written/modified:
  - IMMEDIATELY call code-reviewer agent via Task tool
  - WAIT for code review feedback before proceeding
  - ADDRESS all critical and major issues identified
  - NEVER commit or deploy without code-reviewer approval
```

## Agent-Specific Enforcement Updates

### General-Purpose Agent - Primary Coordinator
**ROLE**: Enforce mandatory delegation and prevent rogue behavior

**MANDATORY PROTOCOLS**:
- **PRE-TASK CHECK**: Before executing ANY task, check mandatory delegation rules
- **VIOLATION PREVENTION**: If task falls under mandatory categories, STOP and delegate
- **COORDINATION OVERSIGHT**: Monitor all specialized agents for proper workflow compliance
- **TRANSPARENCY**: Never claim to coordinate agents unless actually using Task tool

**FORBIDDEN BEHAVIORS**:
- ❌ Executing database tasks directly instead of delegating to database-architect
- ❌ Implementing security code directly instead of delegating to security-engineer
- ❌ Committing code without calling code-reviewer agent
- ❌ Claiming agent coordination without proof of actual Task tool usage

### All Specialized Agents - Workflow Compliance
**MANDATORY REQUIREMENTS FOR ALL AGENTS**:

1. **IMMEDIATE CODE REVIEW**: After writing ANY code, MUST call code-reviewer via Task tool
2. **CROSS-AGENT COORDINATION**: For overlapping tasks, MUST coordinate with relevant specialized agents
3. **EVIDENCE-BASED REPORTING**: MUST provide concrete evidence, not theoretical assessments
4. **100% COMPLETION**: NEVER claim success until 100% completion achieved
5. **DEPLOYMENT AUTHORIZATION**: NEVER deploy to main branch without explicit user authorization

## Violation Detection and Prevention

### Automated Detection Triggers
```
VIOLATION DETECTED IF:
  - Agent executes database work without calling database-architect
  - Agent implements security code without calling security-engineer
  - Agent commits code without calling code-reviewer
  - Agent claims coordination without Task tool evidence
  - Agent bypasses mandatory delegation protocols
```

### Immediate Response Protocol
```
WHEN VIOLATION DETECTED:
  1. IMMEDIATE HALT: "PROTOCOL VIOLATION DETECTED"
  2. IDENTIFICATION: "Task [X] requires specialized agent [Y]"
  3. CORRECTIVE ACTION: "Delegating to [agent-name] to prevent rogue behavior"
  4. USER NOTIFICATION: "Following mandatory protocols to ensure workflow integrity"
  5. PROPER COORDINATION: Use Task tool to delegate to appropriate agent
```

### Escalation Procedures
```
ESCALATION REQUIRED FOR:
  - Repeated delegation bypassing by same agent
  - Security-critical violations
  - Production deployment violations
  - Coordination failures that impact project delivery
```

## Enforcement Mechanisms

### Hard Requirements (Non-Negotiable)
- **DATABASE WORK**: 100% delegation to database-architect required
- **SECURITY WORK**: 100% delegation to security-engineer required  
- **CODE REVIEW**: 100% code-reviewer involvement required
- **EVIDENCE COLLECTION**: All agents must provide concrete proof of completion
- **COORDINATION TRANSPARENCY**: Never claim agent coordination without Task tool proof

### Blocking Authority
- **code-reviewer agent**: Can block ALL deployments until issues resolved
- **security-engineer agent**: Can block security-critical deployments  
- **database-architect agent**: Can block database-related deployments
- **general-purpose agent**: Must enforce delegation rules and coordination protocols

### Accountability Measures
- **Task Documentation**: All delegated tasks tracked via Task tool
- **Evidence Requirements**: Concrete proof required for all completion claims
- **Coordination Validation**: Multi-agent workflows must show actual collaboration
- **User Transparency**: Clear reporting when agents work independently vs collaboratively

## Implementation Status

### ✅ COMPLETED UPDATES

1. **general-purpose.md** - Enhanced with mandatory delegation enforcement
2. **MANDATORY_DELEGATION_ENFORCEMENT.md** - Created comprehensive enforcement protocol
3. **Violation prevention protocols** - Implemented across coordination workflows
4. **Hard boundary definitions** - Clear forbidden vs required behaviors

### 🔄 IN PROGRESS

5. **Security boundary enforcement** - Adding specific security protocol triggers
6. **Cross-agent coordination validation** - Ensuring consistent delegation protocols
7. **Evidence requirements** - Standardizing proof requirements across all agents

## Success Metrics

### Protocol Compliance
- **0%** rogue behavior - All agents follow mandatory delegation rules
- **100%** database work delegated to database-architect
- **100%** security work delegated to security-engineer
- **100%** code changes reviewed by code-reviewer
- **100%** coordination transparency - No false collaboration claims

### Workflow Integrity
- **Proper task delegation** for all specialized work
- **Evidence-based reporting** with concrete proof
- **Cross-agent coordination** using Task tool verification
- **User transparency** about independent vs collaborative work

### Quality Assurance
- **Zero security vulnerabilities** from bypassed security protocols
- **Zero database issues** from bypassed architecture review
- **Zero code quality issues** from bypassed code review
- **100% completion standards** - No partial success accepted as complete

## Next Steps

### For Users
When working with agents, expect:
1. **Proper delegation** - Agents will use specialized agents appropriately
2. **Transparent coordination** - Clear indication when agents actually collaborate
3. **Evidence-based results** - Concrete proof of completion, not theoretical assessments
4. **Quality assurance** - All code reviewed, all security work properly handled

### For Agents
All agents now have:
1. **Clear mandatory boundaries** - Know exactly when delegation is required
2. **Violation prevention** - Built-in checks to prevent rogue behavior
3. **Coordination protocols** - Proper Task tool usage for multi-agent work
4. **Evidence requirements** - Must provide concrete proof of completion

---

**ENFORCEMENT STATUS**: ✅ ACTIVE  
**TOLERANCE LEVEL**: ZERO - No exceptions to mandatory delegation rules  
**COVERAGE**: 100% of agent ecosystem  
**AUTHORITY**: Clear blocking powers for specialized agents  
**TRANSPARENCY**: Required proof of coordination and evidence of completion