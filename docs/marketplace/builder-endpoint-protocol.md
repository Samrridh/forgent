# Builder-hosted agent protocol

For the hackathon, a builder publishes a public HTTPS endpoint. The ZIP is reviewed but is not deployed or executed by Forgent. The endpoint must be reachable from the server without authentication; do not place credentials in the URL.

Forgent sends:

```http
POST /your-endpoint HTTP/1.1
Content-Type: application/json

{"task":"Summarize the supplied text: ..."}
```

A successful response must be a 2xx JSON response with exactly one non-empty `result` string:

```json
{"result":"The summary."}
```

Responses are limited to 64 KiB and must arrive within 15 seconds. Redirects, private-network destinations, literal IP addresses, URL credentials, query parameters, and fragments are rejected. DNS addresses are checked and the connection is pinned to an approved public address. Builders should handle untrusted input and may need their own rate limits and access controls. Endpoint authentication is not yet supported.

The current checkout is a hackathon bypass. It records `DEMO_BYPASSED`; no payment is received. Orders and results are associated with a shared demo persona and are not private. Publishing and bypass endpoints are disabled in production until real authentication and payment controls are implemented.

The request ID prevents a repeated submission from dispatching twice. A request left in `RUNNING` after a server interruption needs manual investigation; the app does not automatically retry, since the endpoint may already have performed work.

## Hackathon test evaluation

The publishing flow can send up to five builder-approved cases to a separate public HTTPS test endpoint using the same protocol. Test inputs must be a JSON string or an object containing only `task`. Expected outputs must be an object containing only a non-empty string `result`. Matching is exact; unsupported cases and endpoint errors are excluded from the percentage. Tests make real requests and may trigger actions or costs, so use a test-only endpoint and synthetic data.

For the repository's manifest-only `knowledge-support-v1` sample, leaving the test endpoint empty runs the platform-owned deterministic support sample against fixed demo articles. This does not execute uploaded source code. Other ZIPs still require a test endpoint. A public HTTPS endpoint remains necessary to publish a hosted listing.

The evaluation form offers platform-provided cases for that sample. These cases match its text-task interface and fixed articles. Gemini's suggested cases remain available separately and may need editing before they can be scored.

The recorded report is builder-submitted demo data. It is not independently verified, does not prove that the test and published endpoints use the same code, and is not a security or overall quality rating. Approved inputs and expectations are stored with the public listing. The ZIP is not executed. Evaluation is disabled in production until authentication, isolation, and durable server-side verification are in place.
