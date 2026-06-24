import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<800"],
    checks: ["rate>0.95"],
  },
};

const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${baseUrl}/api/health`);
  check(res, {
    "health status 200": (r) => r.status === 200,
    "health body ok": (r) => r.json("status") === "ok" || r.json("status") === "degraded",
  });
  sleep(0.2);
}
