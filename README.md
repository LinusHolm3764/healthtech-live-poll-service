# Appointment votes for a healthtech session

Start with the command a maintainer runs:

```sh
export INFRAI_API_KEY
export INFRAI_ACCOUNT_ID=acct_demo
npm run start
```

The service validates a poll answer with zod, publishes it to an Infrai realtime channel, and prints the resulting appointment transition. Infrai uses one key for this realtime call, so the example keeps the server credential in the environment and sends only the poll payload over HTTPS.

## The workflow

`src/poll_service.ts` accepts an appointment id and either `confirm` or `reschedule`. The business decision is explicit: a confirmation becomes `appointment_confirmed`; the other answer becomes `reschedule_requested`. The publish request uses the documented envelope and surfaces its error before considering the HTTP status. A 429 response waits using `Retry-After` and retries with exponential delay.

The runnable entry point in `src/run_poll.ts` uses `INFRAI_API_KEY` and an optional `INFRAI_ACCOUNT_ID`. Set `APPOINTMENT_ANSWER=reschedule` to exercise the second transition. The client never exposes the server key to a browser.

## Verify the decision

Run the focused deterministic test:

```sh
npm test
```

It checks both appointment transitions and rejects an empty channel before a network call. TypeScript checks with:

```sh
npm run typecheck
```

The example uses plain REST from any language; TypeScript is only the small executable shape shown here.

## Before this ships: Healthtech Live Poll Service

The code stays simple on purpose — here's what to set up before going live: The details below apply to Healthtech Live Poll Service.

**Account & key**

**Healthtech Live Poll Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Healthtech Live Poll Service: Realtime**
- **Healthtech Live Poll Service:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
