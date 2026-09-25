process.env.NODE_ENV = "test";
import http from "http";
import { app } from "../src/index.js";

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log("Health check status:", healthRes.status, healthData);
    if (healthRes.status !== 200 || healthData.ok !== true) {
      throw new Error(`Health check failed with status ${healthRes.status}`);
    }

    // 2. Subscription plans listing
    const plansRes = await fetch(`${baseUrl}/subscription/plans`);
    const plansData = await plansRes.json();
    console.log("Subscription plans status:", plansRes.status, `Loaded ${plansData.plans?.length} plans`);
    if (plansRes.status !== 200 || !plansData.plans || plansData.plans.length !== 4) {
      throw new Error("Subscription plans check failed");
    }

    // 3. Payments key check
    const keyRes = await fetch(`${baseUrl}/payments/key`);
    const keyData = await keyRes.json();
    console.log("Payments key status:", keyRes.status, `configured: ${keyData.configured}`);
    if (keyRes.status !== 200) {
      throw new Error("Payments key route check failed");
    }

    console.log("ALL BACKEND HEALTH & ROUTE CHECKS PASSED SUCCESSFULLY!");
    server.close();
  } catch (err) {
    console.error("Health check error:", err);
    server.close();
    process.exit(1);
  }
});
