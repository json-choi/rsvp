import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 모든 페이지가 요청 시점에 D1을 읽는 동적 페이지라 별도 incremental cache는 쓰지 않는다.
export default defineCloudflareConfig({});
