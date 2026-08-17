import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers target for the full-stack Next.js application.
 * R2 incremental caching is intentionally opt-in until a production bucket is
 * provisioned so a fresh deployment never references a non-existent binding.
 */
export default defineCloudflareConfig();
