import { InfraiRealtime, decideAppointment } from "./poll_service.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");

const service = new InfraiRealtime(key);
const answer = process.env.APPOINTMENT_ANSWER === "reschedule" ? "reschedule" : "confirm";
const result = await service.publishVote({
  channel: "session-health-101",
  event: "appointment.vote",
  data: { appointmentId: "apt-204", answer },
  account_id: process.env.INFRAI_ACCOUNT_ID ?? "demo-account"
});
console.log({ accepted: result.accepted, transition: decideAppointment(answer) });
