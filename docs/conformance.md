# MCP conformance run

A repeatable conformance check that points a real MCP client at a **deployed**
`yuno-mcp` endpoint, reads the live `tools/list`, and asserts the contract that
the 2026-09-20 conformance review found no automated check could catch. It is the
executable form of that review: pointed at a healthy deployment it reports 0
findings; if any one of the merged fixes is reverted it fails, naming the tool
and the finding.

## What it checks

It connects as an SDK `Client` over StreamableHTTP and asserts the *live* surface
(never a re-derivation from this repository's source, which is exactly the blind
spot that let `required[]` silently empty). Each assertion maps to a finding from
the report:

| Finding | Assertion |
| --- | --- |
| Empty `required[]` while rejecting missing arguments | Every tool's advertised `required[]` matches what the handler actually enforces (probed with an empty-argument call where that is side-effect-free). |
| Misspelled parameter silently dropped | An unknown / camelCase parameter is refused and the message names the correct snake_case spelling. |
| Advertised name not callable | Every advertised tool name is one `tools/call` accepts. |
| Authorization captures | `paymentAuthorize` never sends a payment that would capture (card and wallet) and refuses payment types it cannot hold. |
| Parameter descriptions dropped | Every top-level parameter that carries a description in the full schema (`describeTool`) still carries it in the live `tools/list`. |
| Lean schema too strict | Each lean advertised schema accepts what the full schema accepts, `null` included. |
| Array-form `type` shorthand | No advertised schema uses `type: [X, "null"]`, which released agent-toolkit versions cannot read. |
| `describeTool` gaps | `describeTool` answers for every tool it names, and each worked example validates against its own schema. |

## Safety

- **Read-only.** Every probe either lists tools or calls a tool with arguments
  that fail validation before any Yuno API request is made. Destructive tools are
  never invoked with arguments that could execute.
- **Non-production by default.** The endpoint defaults to
  `https://api-staging.y.uno/mcp`.
- **Refuses production credentials by default.** A `prod_` public-api-key or the
  `https://api.y.uno` endpoint is refused unless `CONFORMANCE_ALLOW_PROD=true` is
  set deliberately.
- **HTTPS only** (PCI-DSS req 4.1): a non-`https://` endpoint is refused.

## Running it

A single documented command. It exits `0` when the deployment is conformant and
non-zero on any violation (`1` = findings, `2` = configuration / connection
error). Each failure line names the tool and the finding.

```sh
YUNO_MCP_ENDPOINT=https://api-staging.y.uno/mcp \
YUNO_PUBLIC_API_KEY=staging_xxx \
YUNO_PRIVATE_SECRET_KEY=xxx \
YUNO_ACCOUNT_CODE=your-account-code \
npm run conformance
```

The `conformance` script runs the TypeScript entrypoint directly via `tsx`
(a pinned devDependency); no separate build step is required. Node >= 18.

### Environment variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `YUNO_PUBLIC_API_KEY` | yes | — | Selects the environment by prefix (`dev_`, `staging_`, `sandbox_`, `prod_`). |
| `YUNO_PRIVATE_SECRET_KEY` | yes | — | Sent to the deployed MCP endpoint. |
| `YUNO_ACCOUNT_CODE` | yes | — | Yuno account code. |
| `YUNO_MCP_ENDPOINT` | no | `https://api-staging.y.uno/mcp` | The deployed MCP endpoint. |
| `CONFORMANCE_ALLOW_PROD` | no | `false` | Set to `true` to allow a prod key / prod endpoint. |

Credentials are never hard-coded and never logged; supply them from your secret
manager / CI secret store at invocation time.

## Regression coverage in CI

`tests/conformance-runner.test.ts` runs the same checks against an in-memory
client/server pair so `npm test` proves the runner reports 0 findings on the
current code and fails — naming the tool — when any merged fix is reverted (for
example re-adding camelCase aliases or the array-form `type` fold). The live
`npm run conformance` command is what you point at a deployed environment.
