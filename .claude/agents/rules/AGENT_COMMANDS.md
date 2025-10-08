# Agent Creation Commands Reference

## Phase 1: Foundation Agents (Week 1)

### Core Infrastructure Agents
```bash
# Product strategy and roadmap planning
/agents create product-manager --role "Product Strategy & Roadmap Planning"

# Task coordination and progress tracking
/agents create scrum-master --role "Task Coordination & Progress Tracking"

# GDPR migration and database optimization
/agents create database-architect --role "GDPR Migration & Database Optimization"

# Privacy compliance and data protection
/agents create gdpr-specialist --role "Privacy Compliance & Data Protection"
```

## Phase 2: Core Engineering Team (Week 2)

### Development Agents
```bash
# Next.js and React development
/agents create frontend-engineer --role "Next.js & React Development"

# Node.js and API development
/agents create backend-engineer --role "Node.js & API Development"

# Security architecture and threat protection
/agents create security-engineer --role "Security Architecture & Threat Protection"

# Performance optimization and monitoring
/agents create performance-engineer --role "Performance Optimization & Monitoring"
```

### Quality Assurance Agents
```bash
# Code quality and security review
/agents create code-reviewer --role "Code Quality & Security Review"

# Testing and quality assurance
/agents create test-engineer --role "Testing & Quality Assurance"

# Infrastructure and deployment
/agents create devops-engineer --role "Infrastructure & Deployment"
```

## Phase 3: Supporting Specialists (Week 3)

### Design and Documentation
```bash
# Design consistency and user experience
/agents create ui-designer --role "Design Consistency & User Experience"

# Documentation and user guides
/agents create technical-writer --role "Documentation & User Guides"
```

### Growth and Optimization
```bash
# Search optimization and growth
/agents create seo-specialist --role "Search Optimization & Growth"

# Metrics and business intelligence
/agents create analytics-engineer --role "Metrics & Business Intelligence"

# Viral growth and network effects
/agents create growth-specialist --role "Viral Growth & Network Effects"
```

### Customer and Compliance
```bash
# User experience and support
/agents create customer-support --role "User Experience & Support"

# Legal and regulatory compliance
/agents create legal-compliance --role "Legal & Regulatory Compliance"
```

## Agent Usage Examples

### Basic Agent Invocation
```bash
# Direct task assignment
@product-manager Create a feature specification for user notifications

# With specific context
@database-architect Execute GDPR migration step 1 based on the current schema analysis

# Multi-step coordination
@scrum-master Break down this feature specification: [paste spec from product-manager]
```

### Complex Workflow Examples

#### GDPR Migration Execution
```bash
# Step 1: Planning
@product-manager Plan GDPR migration execution strategy

# Step 2: Technical execution
@database-architect Execute migration scripts from database/normalization-optimization/sql-scripts/

# Step 3: Compliance validation
@gdpr-specialist Validate GDPR compliance of migrated architecture: [paste migration results]

# Step 4: Security audit
@security-engineer Audit security of new database architecture: [paste schema details]

# Step 5: Performance validation
@performance-engineer Validate 65% storage reduction and 80% performance improvement
```

#### Feature Development Workflow
```bash
# Step 1: Feature specification
@product-manager Create feature spec for notification system integration

# Step 2: Task breakdown
@scrum-master Break down notification feature: [paste specification]

# Step 3: UI development
@frontend-engineer Build notification bell component for navbar: [paste UI requirements]

# Step 4: API development
@backend-engineer Create notification API endpoints: [paste frontend requirements]

# Step 5: Security review
@security-engineer Review notification system security: [paste implementations]

# Step 6: Performance optimization
@performance-engineer Optimize notification delivery performance

# Step 7: Testing
@test-engineer Create comprehensive tests for notification system

# Step 8: Deployment
@devops-engineer Deploy notification system to staging environment
```

## Agent Status Commands

### Check Agent Status
```bash
# List all created agents
/agents list

# Check specific agent availability
/agents status product-manager

# View agent recent activity
/agents history scrum-master
```

### Agent Management
```bash
# Update agent configuration
/agents configure frontend-engineer --tools "Read,Write,Edit,Bash,Grep,Glob"

# Reset agent context
/agents reset database-architect

# Remove agent (if needed)
/agents delete old-agent-name
```

## Tool Access Matrix Reference

| Agent Type | Read | Write | Edit | Bash | Grep | Glob | Task | WebFetch |
|------------|------|-------|------|------|------|------|------|----------|
| Product Manager | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Scrum Master | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Database Architect | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| GDPR Specialist | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Frontend Engineer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Backend Engineer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Security Engineer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Performance Engineer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Code Reviewer | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Test Engineer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| DevOps Engineer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| UI Designer | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Technical Writer | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| SEO Specialist | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Analytics Engineer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Customer Support | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Legal Compliance | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Growth Specialist | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |

## Agent Configuration Files

All agent configurations are stored in:
```
C:\Jobyfy\jobyfy-production\.claude\agents\
├── product-manager.md
├── scrum-master.md
├── database-architect.md
├── gdpr-specialist.md
└── [additional agents as created]
```

Each agent configuration follows this structure:
```yaml
---
name: agent-name
role: Primary Responsibility
tools: [Tool List]
expertise: Domain Knowledge Description
constraints: Limitations and Rules
---

# Detailed System Prompt Content
```

## Quick Start Commands for Phase 1

To begin Phase 1 foundation setup, run these commands in sequence:

```bash
# 1. Create foundation agents
/agents create product-manager --role "Product Strategy & Roadmap Planning"
/agents create scrum-master --role "Task Coordination & Progress Tracking"

# 2. Test basic functionality
@product-manager Review current CLAUDE.md priorities and create initial roadmap

# 3. Create GDPR specialists
/agents create database-architect --role "GDPR Migration & Database Optimization"
/agents create gdpr-specialist --role "Privacy Compliance & Data Protection"

# 4. Test GDPR workflow
@database-architect Analyze current database structure for GDPR migration readiness
@gdpr-specialist Review GDPR migration requirements and compliance checklist
```

## Troubleshooting Agent Creation

### Common Issues and Solutions

#### Agent Creation Fails
```bash
# Check if agent name already exists
/agents list

# Try with different name
/agents create product-manager-v2 --role "Product Strategy & Roadmap Planning"

# Verify correct syntax
/agents create agent-name --role "Description in quotes"
```

#### Agent Not Responding
```bash
# Check agent status
/agents status agent-name

# Reset agent if needed
/agents reset agent-name

# Try simple test task
@agent-name Hello, please confirm you're working
```

#### Tool Access Issues
```bash
# Verify agent has necessary tools
/agents configure agent-name --tools "Read,Write,Edit,Bash"

# Check current tool configuration
/agents info agent-name
```

This command reference provides everything needed to create and manage the 18-agent team for Jobyfy platform development.