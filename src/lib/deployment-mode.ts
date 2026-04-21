export function isServerMode(): boolean {
  return process.env.DEPLOYMENT_MODE === "server";
}
