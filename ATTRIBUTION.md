# Attribution

> Record of human and AI contributions to this project.

## Project

- **Name:** n8n-sandbox-http
- **Repository:** https://github.com/justice8096/n8n-sandbox-http
- **Started:** 2025 (embedded in TarotCardProject)

---

## Contributors

### Human

| Name | Role | Areas |
|------|------|-------|
| Justice E. Chase | Lead developer | Architecture, design, domain logic, review, integration |

### AI Tools Used

| Tool | Model/Version | Purpose |
|------|---------------|---------|
| Claude | Claude Opus 4.6 | Code generation, documentation, testing, research |
| Claude Code | — | Agentic development, refactoring, extraction |

---

## Contribution Log

### Original Source Code
Extracted from TarotCardProject CLAUDE.md documentation and n8n Code nodes. Justice discovered and solved n8n sandbox restrictions (no fetch, axios crash due to frozen prototypes, no URL constructor). The core http/https workaround pattern is Justice's.

| Date | Tag | Description | AI Tool | Human Review |
|------|-----|-------------|---------|--------------|
| 2025-2026 | `human-only` | n8n sandbox restriction discovery and http/https workaround pattern | — | Justice E. Chase |

### Standalone Extraction

| Date | Tag | Description | AI Tool | Human Review |
|------|-----|-------------|---------|--------------|
| 2026-03-21 | `ai-assisted` | Packaged sandbox restrictions workaround as module | Claude Code | Architecture decisions, reviewed all code |
| 2026-03-21 | `ai-assisted` | Form-data encoding, file upload, streaming support | Claude Code | Reviewed and approved |
| 2026-03-21 | `ai-generated` | Package config, CI/CD workflows, LICENSE | Claude Code | Reviewed and approved |
| 2026-03-21 | `ai-generated` | README documentation with sandbox restriction docs | Claude Code | Reviewed, edited |

### Improvements (2026-03-23)

| Date | Tag | Description | AI Tool | Human Review |
|------|-----|-------------|---------|--------------|
| 2026-03-23 | `ai-generated` | TypeScript declarations and types | Claude Code | Reviewed and approved |
| 2026-03-23 | `ai-generated` | Comprehensive test suite (51 tests) with n8n sandbox emulation | Claude Code | Reviewed and approved |
| 2026-03-23 | `ai-assisted` | Documentation with sandbox restriction details | Claude Code | Reviewed and edited |

---

## Commit Convention

Include `[ai:claude]` tag in commit messages for AI-assisted or AI-generated changes. Example:
```
Package n8n HTTP workaround with form-data support [ai:claude]
```

---

## Disclosure Summary

| Category | Approximate % |
|----------|---------------|
| Human-only code | 25% |
| AI-assisted code | 25% |
| AI-generated (reviewed) | 50% |
| Documentation | 85% AI-assisted |
| Tests | 95% AI-generated |

---

## Notes

- All AI-generated or AI-assisted code is reviewed by a human contributor before merging.
- AI tools do not have repository access or commit privileges.
- This file is maintained manually and may not capture every interaction.
- Original source code was embedded in TarotCardProject before extraction.
- Special domain knowledge: n8n sandbox environment restrictions and workarounds.

---

## License Considerations

AI-generated content may have different copyright implications depending on jurisdiction. See [LICENSE](./LICENSE) for this project's licensing terms. Contributors are responsible for ensuring AI-assisted work complies with applicable policies.
