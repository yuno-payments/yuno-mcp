# MCP conformance run

A repeatable conformance check that points a real MCP client at a **deployed**
`yuno-mcp` endpoint, reads the live `tools/list`, and asserts the contract that
the 2026-09-20 conformance review found no automated check could catch. Pointed
at a healthy deployment it reports 0 findings. If any one of the merged fixes is
reverted, it fails and names the tool and the finding.

## What it checks

It connects as an SDK `Client` over StreamableHTTP. It checks the *live* surface:
what `tools/list` advertises, the full schema the server's own `describeTool`
serves (the schema the handler validates with), and how read-only tools respond
to `tools/call`.

| Finding | Assertion | How |
| --- | --- | --- |
| Empty `required[]` while enforcing arguments | Advertised `required[]` equals the `required[]` of the schema the handler validates with | Static for every tool (lean `tools/list` vs. `describeTool`). Read-only tools are also called with `{}` |
| Misspelled parameter silently dropped | No advertised camelCase alias, `additionalProperties: false` on every tool, and an unknown parameter is refused with a message naming the snake_case spelling | Static for every tool. The live refusal message is checked on read-only tools only |
| Advertised name not callable | Every advertised name is callable, and it appears in the server's tool registry | `tools/call` on read-only tools, plus the `describeTool` registry for all tools |
| Authorization captures | `paymentAuthorize` sends `capture: false` for card and wallet methods and refuses PIX without sending anything | In-process, see below |
| Parameter descriptions dropped | Every top-level parameter with a description in the full schema keeps it in `tools/list` | Static |
| Lean schema too strict | The lean schema accepts `null` wherever the full schema does | Static |
| Array-form `type` shorthand | No advertised schema uses `type: [X, "null"]` | Static |
| `describeTool` gaps | `describeTool` answers for every tool it names, and each worked example validates against its own schema | `describeTool` calls |

A run that probed nothing, for example an empty `tools/list`, no read-only tool
to call, or no `describeTool`, is reported as a finding and never as a pass.

### paymentAuthorize

The deployed endpoint can't show whether an authorization would capture without
creating a real authorization, and that is a side effect this runner must never
cause. So this one check calls the real `paymentAuthorize` tool end to end
(`tools/call` → handler → `YunoClient`) on an in-process server built from the
checked-out commit. Every outbound request is intercepted and answered locally,
and the check asserts the request body that would have gone out. Nothing reaches
the network. To cover a deployment, run the command from the commit that is
deployed.

## Safety

- **No mutating tool is ever called.** `tools/call` goes only to tools the server
  itself marks `readOnlyHint: true`, and to `describeTool`. Mutating and
  destructive tools are checked statically from their advertised schemas, so
  safety never depends on the validation being tested.
  `tests/conformance-runner.test.ts` checks this against the real server, and
  also against a server that silently strips unknown keys.
- **Non-production by default.** The endpoint defaults to
  `https://api-staging.y.uno/mcp`.
- **Production refused by allowlist.** Without `CONFORMANCE_ALLOW_PROD=true`, the
  public-api-key must start with `dev_`, `staging_` or `sandbox_`, and the
  endpoint hostname must contain a `dev`, `staging`, `stg`, `sandbox` or `sb`
  label. Any other host is refused.
- **HTTPS only** (PCI-DSS req 4.1). This applies even with the prod override.

## Running it

It exits `0` when the deployment is conformant, `1` on findings, and `2` on a
configuration or connection error. Each failure line names the tool and the
finding.

```sh
YUNO_MCP_ENDPOINT=https://api-staging.y.uno/mcp \
YUNO_PUBLIC_API_KEY=staging_xxx \
YUNO_PRIVATE_SECRET_KEY=xxx \
YUNO_ACCOUNT_CODE=your-account-code \
npm run conformance
```

`npm run conformance` runs `src/conformance/cli.ts` with `tsx`, a pinned
devDependency. The CLI always runs `main()` and sets the exit code, so no
build step is needed. Requires Node >= 18.

### Environment variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `YUNO_PUBLIC_API_KEY` | yes | — | Sent as the `public-api-key` header. Must have a non-prod prefix unless overridden. |
| `YUNO_PRIVATE_SECRET_KEY` | yes | — | Sent as the `private-secret-key` header. |
| `YUNO_ACCOUNT_CODE` | yes | — | Sent as the `x-account-code` header. |
| `YUNO_MCP_ENDPOINT` | no | `https://api-staging.y.uno/mcp` | The deployed MCP endpoint. |
| `CONFORMANCE_ALLOW_PROD` | no | `false` | Set to `true` to allow a production key or host. |

The header names `public-api-key` and `private-secret-key` are the ones
`YunoClient` sends to the Yuno API. This repository does not contain the HTTP
host that serves the MCP endpoint (`remote-yuno-mcp`), so how that host reads
credentials, including `x-account-code`, can't be verified here. If the host
expects different names, change `authHeaders` in `src/conformance/run.ts`.

Credentials are never hard-coded and never logged. Supply them from your secret
manager or CI secret store when you run the command.

## Regression coverage in CI

`tests/conformance-runner.test.ts` runs the same checks against an in-memory
client/server pair, so `npm test` shows that the runner:

- reports 0 findings on the current code;
- fails, naming the tool, when a merged fix is reverted, for example a re-added
  camelCase alias or the array-form `type` fold;
- never calls a mutating tool;
- exits non-zero when nothing was probed.

The live `npm run conformance` command is what you point at a deployed
environment.
