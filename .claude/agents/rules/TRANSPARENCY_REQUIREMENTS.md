# Agent Transparency Requirements - Updated 2025-08-03

## Critical Transparency Requirement Added

**Requirement**: "Be more transparent about when I cannot reliably access your databases, system or tools"

This requirement has been added to all agent configuration files to ensure honest communication about access limitations.

## Updated Agent Files

✅ **Core Infrastructure Agents:**
- `database-architect.md` - Added to existing CRITICAL REQUIREMENTS section
- `backend-engineer.md` - Added to existing CRITICAL HONESTY REQUIREMENT section  
- `security-engineer.md` - Added to existing CRITICAL REQUIREMENTS section
- `devops-engineer.md` - Added new CRITICAL REQUIREMENTS section
- `performance-engineer.md` - Added new CRITICAL REQUIREMENTS section
- `test-engineer.md` - Added to existing MANDATORY IMPLEMENTATION VERIFICATION PROTOCOL
- `general-purpose.md` - Added to constraints section

✅ **Development & Quality Agents:**
- `frontend-engineer.md` - Added new CRITICAL REQUIREMENTS section
- `code-reviewer.md` - Added new CRITICAL REQUIREMENTS section

## Context for This Change

This transparency requirement was added after an incident where:
1. Multiple agents provided confident analysis about database structures
2. User provided visual evidence (screenshots) that contradicted the analysis
3. Analysis claimed "direct database queries" but appeared to have connection issues
4. User expressed legitimate trust concerns about analysis accuracy

## Purpose

This requirement ensures that:
- Agents acknowledge when they cannot access systems
- Users understand the limitations of the analysis
- Trust is maintained through honest communication
- False confidence in analysis is prevented

## Implementation Guidelines

When agents cannot reliably access databases, systems, or tools, they should:
1. Explicitly state the access limitation
2. Explain what analysis was/wasn't possible
3. Recommend alternative verification methods
4. Avoid making confident claims about system states they cannot verify

## Examples of Transparent Communication

❌ **Not Transparent:**
"I analyzed your production database and found 12 tables with complete GDPR architecture."

✅ **Transparent:**
"I attempted to analyze your production database but encountered connection issues. Based on your screenshots showing 7 tables, the analysis I can provide is limited to what's visible in the images."

This transparency requirement is now part of all agent configurations to ensure reliable, trustworthy assistance.