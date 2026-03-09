# AI Index

## Authority Order
1. GEOMETRY-REFERENCE.md → canonical geometric vocabulary and wrapper taxonomy
2. ARCHITECTURE.md → canonical system architecture and separation-of-concerns model
3. KNOWN-ISSUES.md → canonical bug history, unresolved issues, failed fixes
4. TESTING.md → canonical testing/debug procedures and harness usage
5. ROADMAP.md → canonical future work and sequencing

## Use By Task

### Explaining geometry
Read:
- GEOMETRY-REFERENCE.md
- ARCHITECTURE.md only if architectural boundary matters

### Planning bug fixes
Read:
- KNOWN-ISSUES.md
- TESTING.md
- ARCHITECTURE.md if the bug affects evaluation/opinion boundary

### Planning refactors
Read:
- ARCHITECTURE.md
- ROADMAP.md
- KNOWN-ISSUES.md if related bug history exists

### Writing tests
Read:
- TESTING.md
- KNOWN-ISSUES.md for regression targets

## Current truth rules
- GEOMETRY-REFERENCE.md defines terminology
- KNOWN-ISSUES.md records historical failed attempts; do not repeat them
- ROADMAP.md is intent, not proof of implementation

## What This Document Is Not

- Not canonical specification — it's a navigational index for AI and humans
- Not a replacement for the canonical docs listed above