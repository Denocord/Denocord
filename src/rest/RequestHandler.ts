import Client from "../Client.ts";
import SequentialBucket from "../lib/SequentialBucket.ts";
import { API_BASE } from "../lib/constants.ts";

class RequestHandler {
  // TODO(TTtie): version should be filled automatically
  private ua = "DiscordBot (https://github.com/Denocord/Denocord, 0.0.1)";
  private routeMapping: Record<string, string> = {};
  private ratelimitBuckets = new Map<string, SequentialBucket>();
  public constructor(private client: Client) {
  }

  public toRoute(method: string, path: string) {
    return `${method}:${
      path.replace(/\/([a-z-]+)\/(?:[0-9]{17,19})/g, (match, p) => {
        if (p === "channels" || p === "guilds" || p === "webhooks") {
          return `/${p}/:id`;
        } else {
          return match;
        }
      }).replace(/\/reactions\/[^/]+/g, "/reactions/:id")
    }`;
  }

  public request(
    method: string,
    path: string,
    auth: boolean = true,
    body?: any,
  ): Promise<any> {
    if (method === "GET") {
      const urlsp = new URLSearchParams(body);
      path += urlsp.toString();
      body = undefined;
    }
    const r = this.toRoute(method, path);
    let bucketName = this.routeMapping[r] || r;
    return new Promise(async (rs, rj) => {
      let bucket: SequentialBucket = this.ratelimitBuckets.get(bucketName)!;
      if (!bucket) {
        bucket = new SequentialBucket();
        this.ratelimitBuckets.set(bucketName, bucket);
      }

      const headers: Record<string, string> = {
        "User-Agent": this.ua,
        Authorization: auth ? (<any> this.client).token : undefined,
        "X-RateLimit-Precision": "millisecond",
      };

      if (!(body instanceof FormData) && body && body.reason) {
        headers["X-Audit-Log-Reason"] = body.reason;
        delete body.reason;
      }
      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }
      const doRequest = async () => {
        console.log("Sending a request to Discord...");
        try {
          const resp = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: typeof body === "object" && !(body instanceof FormData)
              ? JSON.stringify(body)
              : body,
          });
          const data = await resp.json();
          if (resp.ok) {
            if (resp.headers.has("x-ratelimit-bucket")) {
              const b = resp.headers.get("x-ratelimit-bucket")!;
              if (b !== bucketName) {
                this.ratelimitBuckets.delete(r);
                this.ratelimitBuckets.set(b, bucket);
                this.routeMapping[r] = b;
              }
            }

            if (resp.headers.has("x-ratelimit-limit")) {
              bucket.limit = +resp.headers.get("x-ratelimit-limit")!;
            }

            if (resp.headers.has("x-ratelimit-remaining")) {
              bucket.remaining =
                +(resp.headers.get("x-ratelimit-remaining") || 0);
            }

            if (resp.headers.has("x-ratelimit-reset")) {
              bucket.resetOn = +resp.headers.get("x-ratelimit-reset")! * 1000;
            }
            const discordTime = Date.parse(resp.headers.get("date")!);
            bucket.lastTime = discordTime;
            rs(data);
          } else {
            if (resp.status === 429) {
              let retryAfter = +resp.headers.get("retry-after")!;
              // request routed through cloudflare
              if (
                resp.headers.has("retry-after") && resp.headers.has("via") &&
                !resp.headers.get("via")!.includes("1.1 google")
              ) {
                retryAfter *= 1000;
              }
              console.warn("Unexpected 429 :(");
              setTimeout(() => {
                this.request(method, path, auth, body).then(rs, rj);
              }, retryAfter);
            }
          }
        } catch (err) {
          rj(err);
        }
      };
      bucket!.add(doRequest);
    });
  }
}

export default RequestHandler;
