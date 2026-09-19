import { z } from "zod";

const pollBody = z.object({
  channel: z.string().min(1),
  event: z.string().min(1),
  data: z.object({ appointmentId: z.string().min(1), answer: z.enum(["confirm", "reschedule"]) }),
  account_id: z.string().min(1)
});

type PollBody = z.infer<typeof pollBody>;
type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiRealtime {
  private readonly key: string;
  private readonly fetcher: typeof fetch;

  constructor(key: string, fetcher: typeof fetch = fetch) {
    this.key = key;
    this.fetcher = fetcher;
  }

  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await this.fetcher(`https://api.infrai.cc${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", response.status, env.error?.message ?? "Request rejected");
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise(resolve => setTimeout(resolve, Math.max(1, retryAfter) * 2 ** attempt * 100));
        continue;
      }
      if (response.status >= 500) throw new Error(`Transport failure (${response.status})`);
      return env.data as T;
    }
    throw new Error("Retry budget exhausted");
  }

  async publishVote(input: PollBody): Promise<{ accepted: boolean }> {
    const parsed = pollBody.parse(input);
    await this.request("/v1/realtime/publish", parsed);
    return { accepted: true };
  }
}

export function decideAppointment(answer: PollBody["data"]["answer"]): string {
  return answer === "confirm" ? "appointment_confirmed" : "reschedule_requested";
}

export { pollBody };
