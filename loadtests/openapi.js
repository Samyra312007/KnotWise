import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "20s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
  },
};

const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${baseUrl}/api/openapi`);
  check(res, {
    "openapi status 200": (r) => r.status === 200,
    "openapi has paths": (r) => Boolean(r.json("paths")),
  });
  sleep(0.3);
}
