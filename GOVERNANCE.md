# Governance

## Purpose
Cattle Guard Forms is maintained as a secure, auditable, and user-focused SaaS codebase.

## Principles
- **Security first:** Never commit real secrets or customer data.
- **Reproducibility:** Keep setup and local workflows deterministic.
- **Incremental delivery:** Favor small pull requests with clear scope.
- **Documentation:** Update docs and environment guidance with behavior changes.

## Contribution Expectations
1. Open changes through pull requests.
2. Keep CI green (build, lint, tests as available).
3. Include migration notes for breaking or operational changes.

## Security and Compliance
- Secrets must remain in environment variables.
- Use least-privilege API keys for Supabase and Stripe.
- Rotate leaked credentials immediately and document incident response actions.

## Ownership
Repository maintainers are responsible for code review policy, release approvals, and operational governance updates.
