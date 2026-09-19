import assert from "node:assert/strict";
import { decideAppointment, pollBody } from "./poll_service.js";

assert.equal(decideAppointment("confirm"), "appointment_confirmed");
assert.equal(decideAppointment("reschedule"), "reschedule_requested");
assert.throws(() => pollBody.parse({ channel: "", event: "appointment.vote", data: { appointmentId: "a", answer: "confirm" }, account_id: "acct" }));
console.log("appointment decision checks passed");
