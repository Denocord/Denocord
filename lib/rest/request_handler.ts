import { VERSION } from "../../mod.ts";
import { token } from "../client.ts";
import SequentialBucket from "./sequential_bucket.ts";
import { API_BASE, API_REST_VERSION } from "../util/constants.ts";

const MAJOR_PARAMETER_REGEX = /^\/(?:channels|guilds|webhooks)\/(?<id>\d+)/;

class RequestHandler {
  private ua = `DiscordBot (https://github.com/Denocord/Denocord, ${VERSION})`;
  private ratelimitBuckets = new Map<string, SequentialBucket>();
  public globallyRatelimited = false;
  private globalRatelimitQueue: Function[] = [];
  public routeMapping: Record<string, string> = {};

  private static instance: RequestHandler;

  public static get() {
    return this.instance ?? (this.instance = new RequestHandler());
  }
  private constructor() {}

  public toRoute(method: string, path: string) {
    return `${method}:${
      path.replace(/\/([a-z-]+)\/(?:[0-9]{17,19})/g, (match, p) => {
        if (p === "channels" || p === "guilds" || p === "webhooks") {
          return match;
        } else {
          return `/${p}/:id`;
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
    let actionReason: string | undefined;
    if (!(body instanceof FormData) && body && body.reason) {
      actionReason = encodeURIComponent(body.reason);
      if (method !== "POST" || !path.includes("/prune/")) delete body.reason;
    }

    if (method === "GET" || method === "DELETE") {
      if (body) {
        const urlsp = new URLSearchParams();
        for (const k of Object.keys(body)) {
          if (Array.isArray(body[k])) {
            for (const val of body[k]) {
              urlsp.append(k, val);
            }
          } else {
            urlsp.append(k, body[k]);
          }
        }
        path += `?${urlsp}`;
        body = undefined;
      }
    }
    const majorParamMatch = path.match(MAJOR_PARAMETER_REGEX);
    const route = this.toRoute(method, path);
    const bucketName = this.routeMapping[route] || route;
    return new Promise(async (rs, rj) => {
      let bucket: SequentialBucket = this.ratelimitBuckets.get(bucketName)!;
      if (!bucket) {
        bucket = new SequentialBucket();
        this.ratelimitBuckets.set(bucketName, bucket);
      }

      const headers: Record<string, string> = {
        "User-Agent": this.ua,
        Authorization: auth ? token : "",
        "X-RateLimit-Precision": "millisecond",
        "X-Audit-Log-Reason": actionReason || "",
      };

      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }
      const doRequest = async () => {
        console.log("Sending a request to Discord...");
        try {
          const resp = await fetch(
            `${API_BASE}/api/v${API_REST_VERSION}${path}`,
            {
              method,
              headers,
              body: typeof body === "object" && !(body instanceof FormData)
                ? JSON.stringify(body)
                : body,
            },
          );

          const discordTime = Date.parse(resp.headers.get("date")!);

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
          bucket.lastTime = discordTime;
          bucket.lastLocalTime = Date.now();
          if (resp.headers.has("x-ratelimit-bucket")) {
            const b = resp.headers.get("x-ratelimit-bucket")!;
            const bucketID = majorParamMatch
              ? `${b}-${majorParamMatch.groups?.id}`
              : b;
            if (bucketID !== bucketName) { // using per-route ratelimit
              this.ratelimitBuckets.delete(bucketName);
              this.ratelimitBuckets.set(bucketID, bucket);
              this.routeMapping[route] = bucketID;
            }
          }

          if (resp.status === 204) rs();
          const data = await resp.json();

          if (resp.ok) {
            rs(data);
          } else {
            if (resp.status === 429) {
              let retryAfter = +resp.headers.get("retry-after")! || 0;
              // request routed through cloudflare
              if (
                resp.headers.has("retry-after") && resp.headers.has("via") &&
                !resp.headers.get("via")!.includes("1.1 google")
              ) {
                retryAfter *= 1000;
              }

              if (retryAfter) {
                if (resp.headers.get("x-ratelimit-global")) {
                  this.globallyRatelimited = true;
                  setTimeout(() => this.globalUnlock(), retryAfter);
                } else {
                  bucket.resetOn = discordTime + retryAfter;
                }
              }
              console.warn(
                `${this.globallyRatelimited ? "Global" : "Unexpected"} 429 :(`,
              );
              console.warn(JSON.stringify(data, null, 4));
              setTimeout(() => {
                this.request(method, path, auth, body).then(rs, rj);
              }, retryAfter);
            } else {
              rj(
                new Error(
                  `${resp.status}: ${resp.statusText}\n${
                    JSON.stringify(data, null, 4)
                  }`,
                ),
              );
            }
          }
        } catch (err) {
          rj(err);
        }
      };
      if (this.globallyRatelimited) {
        this.globalRatelimitQueue.push(() => {
          bucket!.add(doRequest);
        });
      } else {
        bucket!.add(doRequest);
      }
    });
  }

  private globalUnlock() {
    this.globallyRatelimited = false;
    while (this.globalRatelimitQueue.length > 0) {
      this.globalRatelimitQueue.shift()!();
    }
  }
}

export default RequestHandler;
