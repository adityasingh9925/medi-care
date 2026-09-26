import http from "http";
import axios from "axios";
import { app } from "../app.js";
import { prisma } from "../config/db.js";

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 5000;
  const baseURL = `http://localhost:${port}/api/auth`;

  const client = axios.create({
    baseURL,
    validateStatus: () => true, // allow handling non-2xx responses
  });

  const uniqueSuffix = Date.now();
  const testUser = {
    email: `test_rotation_${uniqueSuffix}@example.com`,
    password: "Password123!",
    fullName: "Rotation Test User",
  };

  console.log("=== 1. Testing Registration with Refresh Token ===");
  const registerRes = await client.post("/register", testUser);
  console.log(`Registration status: ${registerRes.status}`);
  if (registerRes.status !== 201) {
    throw new Error(`Register failed: ${JSON.stringify(registerRes.data)}`);
  }
  const { accessToken: at1, refreshToken: rt1 } = registerRes.data.data;
  const setCookie = registerRes.headers["set-cookie"];
  console.log("Set-Cookie header received:", !!setCookie);
  console.log("Access Token received:", !!at1);
  console.log("Refresh Token received:", !!rt1);

  if (!at1 || !rt1) {
    throw new Error("Missing tokens in registration response");
  }

  console.log("\n=== 2. Testing /me endpoint with Access Token ===");
  const meRes = await client.get("/me", {
    headers: { Authorization: `Bearer ${at1}` },
  });
  console.log(`Me status: ${meRes.status}`, meRes.data.data?.user?.email ?? meRes.data);
  if (meRes.status !== 200) {
    throw new Error("/me endpoint failed with valid access token");
  }

  console.log("\n=== 3. Testing Token Rotation (/refresh) ===");
  const refreshRes1 = await client.post(
    "/refresh",
    { refreshToken: rt1 },
    {
      headers: setCookie ? { Cookie: setCookie.join("; ") } : undefined,
    }
  );
  console.log(`Rotation 1 status: ${refreshRes1.status}`);
  if (refreshRes1.status !== 200) {
    throw new Error(`Refresh failed: ${JSON.stringify(refreshRes1.data)}`);
  }
  const { accessToken: at2, refreshToken: rt2 } = refreshRes1.data.data;
  console.log("New Access Token generated:", !!at2);
  console.log("New Refresh Token generated:", !!rt2);
  console.log("Different Refresh Token issued:", rt1 !== rt2);

  if (!at2 || !rt2 || rt1 === rt2) {
    throw new Error("Rotation failed to generate new distinct refresh token");
  }

  console.log("\n=== 4. Testing Reuse Detection (Attacking with old rt1) ===");
  const reuseRes = await client.post("/refresh", { refreshToken: rt1 });
  console.log(`Reuse attack response status: ${reuseRes.status}`);
  console.log(`Reuse attack error code:`, reuseRes.data.error?.code);
  if (reuseRes.status !== 401 || reuseRes.data.error?.code !== "TOKEN_REUSE_DETECTED") {
    throw new Error("Reuse attack was not correctly detected and blocked!");
  }

  console.log("\n=== 5. Testing Invalidation of Family after Reuse Attack ===");
  const subsequentRes = await client.post("/refresh", { refreshToken: rt2 });
  console.log(`Subsequent request with rt2 status: ${subsequentRes.status}`);
  console.log(`Subsequent error code:`, subsequentRes.data.error?.code);
  if (subsequentRes.status !== 401) {
    throw new Error("Compromised family tokens were not invalidated!");
  }

  console.log("\n=== 6. Testing Login & Logout ===");
  const loginRes = await client.post("/login", {
    email: testUser.email,
    password: testUser.password,
  });
  console.log(`Login status: ${loginRes.status}`);
  const { accessToken: at3, refreshToken: rt3 } = loginRes.data.data;

  const logoutRes = await client.post("/logout", { refreshToken: rt3 });
  console.log(`Logout status: ${logoutRes.status}`);
  if (logoutRes.status !== 200) {
    throw new Error("Logout failed");
  }

  // Attempting to refresh with logged-out token
  const afterLogoutRes = await client.post("/refresh", { refreshToken: rt3 });
  console.log(`Refresh after logout status: ${afterLogoutRes.status}`);
  if (afterLogoutRes.status !== 401) {
    throw new Error("Logged out token should not be usable for refresh");
  }

  console.log("\n=== 7. Testing Logout-All Devices ===");
  const loginRes2 = await client.post("/login", {
    email: testUser.email,
    password: testUser.password,
  });
  const { accessToken: at4, refreshToken: rt4 } = loginRes2.data.data;

  const logoutAllRes = await client.post(
    "/logout-all",
    {},
    {
      headers: { Authorization: `Bearer ${at4}` },
    }
  );
  console.log(`LogoutAll status: ${logoutAllRes.status}`, logoutAllRes.data);
  if (logoutAllRes.status !== 200) {
    throw new Error("Logout-all failed");
  }

  const afterLogoutAllRes = await client.post("/refresh", { refreshToken: rt4 });
  console.log(`Refresh after logout-all status: ${afterLogoutAllRes.status}`);
  if (afterLogoutAllRes.status !== 401) {
    throw new Error("Token should be revoked after logout-all");
  }

  // Cleanup test user
  await prisma.user.delete({
    where: { email: testUser.email.toLowerCase() },
  });

  console.log("\n All token rotation & reuse detection tests PASSED successfully!");

  server.close();
  await prisma.$disconnect();
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
