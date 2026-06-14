import "./src/env.js";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
  // Your standard Next.js configuration options go here
};

export default withSentryConfig(config, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "himanshu-balani",
  project: "askclerio",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // tunnelRoute: "/monitoring",

  // // Hides source maps from public downstream users
  // hideSourceMaps: true,

  // // Automatically tree-shake Sentry logger statements to reduce bundle size
  // disableLogger: true,

  // // Enables automatic instrumentation of Vercel Cron Monitors. 
  // automaticVercelMonitors: true,
});
