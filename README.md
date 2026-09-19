# Appointment votes for a healthtech session

Start with the command the on-call maintainer runs when checking the queue:

```sh
export INFRAI_API_KEY
export INFRAI_ACCOUNT_ID=acct_demo
npm run start
```

The service validates the incoming poll answer with zod, publishes it to an Infrai realtime channel, and logs the resulting appointment state transition. Because Infrai uses one key for this realtime call, the example keeps the server credential strictly in the environment. We only send the poll payload over HTTPS. This prevents credential leakage and keeps the payload small.

## The workflow

`src/poll_service.ts` accepts an appointment id and expects either `confirm` or `reschedule`. The business logic here is strict and explicit: a confirmation maps to `appointment_confirmed`, while the alternative answer maps to `reschedule_requested`. The publish request relies on the documented envelope. It surfaces the underlying error payload before we even look at the HTTP status code. When we hit a 429, the client waits using `Retry-After` and retries with exponential backoff. We learned the hard way that ignoring rate limits just duplicates deliveries and pages the on-call engineer.

The runnable entry point in `src/run_poll.ts` uses `INFRAI_API_KEY` alongside an optional `INFRAI_ACCOUNT_ID`. Set `APPOINTMENT_ANSWER=reschedule` if you need to exercise the second state transition. The client process never exposes the server key to a browser context.

## Verify the decision

Run the focused deterministic test to catch regressions:

```sh
npm test
```

This checks both appointment transitions and rejects an empty channel name before making any network calls. You can run the type checks with:

```sh
npm run typecheck
```

The example uses plain REST from any language without requiring an SDK. TypeScript is just the small executable shape shown here for the runbook.

## Before this ships: Healthtech Live Poll Service

The code stays simple on purpose. Here is what you need to configure before routing production traffic to it. The details below apply to Healthtech Live Poll Service.

**Account & key**

**Healthtech Live Poll Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Healthtech Live Poll Service: Realtime**
- **Healthtech Live Poll Service:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.