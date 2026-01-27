const { withWorkflow } = require("workflow/next");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withWorkflow(nextConfig);
