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
