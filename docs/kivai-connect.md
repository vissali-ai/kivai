# Kivai Connect MVP

One hub `/ferramentas/smart-tv-tv-box`, one tool `/ferramentas/kivai-connect`.
Both require published CMS entries. Content, SEO, hub placement, tutorial URL,
publication and indexability use the existing Admin. No new database schema.

Windows helper pairs using official, separately obtained Android Platform Tools.
Only modern wireless pairing is supported. IP restricted to private IPv4.
Pair code is read without echo and sent to ADB stdin, never in process arguments.
ADB uses a separate server port (5041). Read commands are fixed in source.
User must type COLETAR before diagnostics. Connection is then disconnected.
Authorized pairing keys remain on the computer until revoked by the user.

The helper exposes only an immutable report on loopback 127.0.0.1:47831 for ten
minutes. Exact production Origin and Host checks, a random 256-bit session token,
bounded headers and read timeouts protect the endpoint. No command API exists.
DNS rebinding, cross-origin access and missing/incorrect tokens are rejected.
Browser local-network restrictions vary; manual JSON import is always available.
Local report path: `%LOCALAPPDATA%\KivaiConnect\kivai-tv.json`.

Report import is bounded, schema-validated and excludes unknown fields. No HTML
from reports is rendered. Optional localStorage history stores at most five
reports and can be erased. Nothing is automatically uploaded.

AI uses the existing authenticateBillingUser, reserveAiCredits/finalizeAiCredits,
reserveAiRequest and requestGeminiJson. One existing insight credit per completed
analysis, refunds on errors. Only a device/metrics summary is submitted after
explicit consent. AI output is a strict list of predefined guidance IDs, never
shell commands or application removal targets. No changes to credit rules.

Build helper: `powershell -File scripts/build-connect-agent.ps1` on Windows.
Tests: `node --test tests/connect/contract.test.mjs tests/cms/catalog.test.mjs`.
CMS: `node scripts/register-kivai-connect.mjs --inspect`, then `--draft`, and
`--publish` only when the release is approved and deployed. Existing editorial
content is not overwritten when rerunning the registration script.

Release limitations: unsigned Windows beta, no physical-device certification,
no app installation/deactivation, no remote control, no guaranteed optimization.
Never recommend bypassing SmartScreen or publishing ADB ports. Hardware pairing
and wireless behavior require a follow-up test on a user-authorized TV.
