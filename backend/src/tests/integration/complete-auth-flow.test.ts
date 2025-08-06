import request from "supertest";
import { app } from "../../app";
import prisma from "../../lib/prisma";

describe("Complete Authentication Flow", () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe("End-to-end registration and login with weak passwords", () => {
    const testCases = [
      {
        password: "123",
        description: "numeric password",
        userData: {
          email: "numeric-flow@example.com",
          fullName: "Numeric User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        },
      },
      {
        password: "a",
        description: "single character password",
        userData: {
          email: "single-char-flow@example.com",
          fullName: "Single Char User",
          phoneNumber: "+254712345679",
          role: "FARMER",
          location: "Nairobi",
        },
      },
      {
        password: "password",
        description: "common weak password",
        userData: {
          email: "common-weak-flow@example.com",
          fullName: "Common Weak User",
          phoneNumber: "+254712345680",
          role: "BUYER",
        },
      },
      {
        password: "test",
        description: "simple word password",
        userData: {
          email: "simple-word-flow@example.com",
          fullName: "Simple Word User",
          phoneNumber: "+254712345681",
          role: "FARMER",
          location: "Mombasa",
          farmSize: 5.5,
        },
      },
    ];

    testCases.forEach(({ password, description, userData }) => {
      it(`should complete full auth flow with ${description}`, async () => {
        const registrationData = { ...userData, password };

        // Step 1: Registration
        const registerResponse = await request(app)
          .post("/api/auth/register")
          .send(registrationData)
          .expect(201);

        expect(registerResponse.body.success).toBe(true);
        expect(registerResponse.body.data.user.email).toBe(userData.email);
        expect(registerResponse.body.data.tokens.accessToken).toBeDefined();
        expect(registerResponse.body.data.tokens.refreshToken).toBeDefined();

        const { accessToken: registerAccessToken, refreshToken } =
          registerResponse.body.data.tokens;

        // Step 2: Verify immediate access with registration tokens
        const profileResponse = await request(app)
          .get("/api/auth/profile")
          .set("Authorization", `Bearer ${registerAccessToken}`)
          .expect(200);

        expect(profileResponse.body.success).toBe(true);
        expect(profileResponse.body.data.user.email).toBe(userData.email);
        expect(profileResponse.body.data.user.fullName).toBe(userData.fullName);

        // Step 3: Login with same credentials
        const loginResponse = await request(app)
          .post("/api/auth/login")
          .send({
            email: userData.email,
            password: password,
          })
          .expect(200);

        expect(loginResponse.body.success).toBe(true);
        expect(loginResponse.body.data.user.email).toBe(userData.email);
        expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
        expect(loginResponse.body.data.tokens.refreshToken).toBeDefined();

        const { accessToken: loginAccessToken } =
          loginResponse.body.data.tokens;

        // Step 4: Verify access with login tokens
        const profileAfterLoginResponse = await request(app)
          .get("/api/auth/profile")
          .set("Authorization", `Bearer ${loginAccessToken}`)
          .expect(200);

        expect(profileAfterLoginResponse.body.success).toBe(true);
        expect(profileAfterLoginResponse.body.data.user.email).toBe(
          userData.email
        );

        // Step 5: Test token refresh
        const refreshResponse = await request(app)
          .post("/api/auth/refresh")
          .send({ refreshToken })
          .expect(200);

        expect(refreshResponse.body.success).toBe(true);
        expect(refreshResponse.body.data.tokens.accessToken).toBeDefined();
        expect(refreshResponse.body.data.tokens.refreshToken).toBeDefined();

        const { accessToken: newAccessToken } =
          refreshResponse.body.data.tokens;

        // Step 6: Verify access with refreshed tokens
        const profileAfterRefreshResponse = await request(app)
          .get("/api/auth/profile")
          .set("Authorization", `Bearer ${newAccessToken}`)
          .expect(200);

        expect(profileAfterRefreshResponse.body.success).toBe(true);
        expect(profileAfterRefreshResponse.body.data.user.email).toBe(
          userData.email
        );

        // Step 7: Test logout
        const logoutResponse = await request(app)
          .post("/api/auth/logout")
          .set("Authorization", `Bearer ${newAccessToken}`)
          .send({ refreshToken: refreshResponse.body.data.tokens.refreshToken })
          .expect(200);

        expect(logoutResponse.body.success).toBe(true);
        expect(logoutResponse.body.data.message).toContain(
          "Logged out successfully"
        );
      });
    });
  });

  describe("JWT token generation and validation with weak passwords", () => {
    it("should generate valid JWT tokens for weak password users", async () => {
      const registrationData = {
        email: "jwt-validation@example.com",
        password: "123",
        fullName: "JWT Validation User",
        phoneNumber: "+254712345682",
        role: "BUYER",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      const { accessToken, refreshToken } = response.body.data.tokens;

      // Verify token structure and properties
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe("string");
      expect(accessToken.split(".")).toHaveLength(3); // JWT has 3 parts

      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe("string");
      expect(refreshToken.split(".")).toHaveLength(3); // JWT has 3 parts

      // Test token validation by making authenticated requests
      const authenticatedRequests = [
        { method: "get", path: "/api/auth/profile" },
        {
          method: "put",
          path: "/api/auth/profile",
          body: { fullName: "Updated Name" },
        },
      ];

      for (const req of authenticatedRequests) {
        const testRequest = request(app)
          [req.method as keyof typeof request](req.path)
          .set("Authorization", `Bearer ${accessToken}`);

        if (req.body) {
          testRequest.send(req.body);
        }

        const authResponse = await testRequest.expect(200);
        expect(authResponse.body.success).toBe(true);
      }
    });

    it("should handle token expiry and refresh correctly", async () => {
      const registrationData = {
        email: "token-expiry@example.com",
        password: "weak",
        fullName: "Token Expiry User",
        phoneNumber: "+254712345683",
        role: "BUYER",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      const { refreshToken } = response.body.data.tokens;

      // Test multiple refresh cycles
      let currentRefreshToken = refreshToken;

      for (let i = 0; i < 3; i++) {
        const refreshResponse = await request(app)
          .post("/api/auth/refresh")
          .send({ refreshToken: currentRefreshToken })
          .expect(200);

        expect(refreshResponse.body.success).toBe(true);
        expect(refreshResponse.body.data.tokens.accessToken).toBeDefined();
        expect(refreshResponse.body.data.tokens.refreshToken).toBeDefined();

        // Verify new access token works
        const profileResponse = await request(app)
          .get("/api/auth/profile")
          .set(
            "Authorization",
            `Bearer ${refreshResponse.body.data.tokens.accessToken}`
          )
          .expect(200);

        expect(profileResponse.body.success).toBe(true);

        currentRefreshToken = refreshResponse.body.data.tokens.refreshToken;
      }
    });
  });

  describe("Session management with simplified validation", () => {
    it("should manage sessions properly with weak passwords", async () => {
      const registrationData = {
        email: "session-management@example.com",
        password: "123",
        fullName: "Session Management User",
        phoneNumber: "+254712345684",
        role: "BUYER",
      };

      // Register user
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      const { refreshToken: token1 } = registerResponse.body.data.tokens;

      // Login again (should create new session)
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: registrationData.email,
          password: registrationData.password,
        })
        .expect(200);

      const { accessToken, refreshToken: token2 } =
        loginResponse.body.data.tokens;

      // Both tokens should work
      await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: token1 })
        .expect(200);

      await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: token2 })
        .expect(200);

      // Logout with specific token
      await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ refreshToken: token2 })
        .expect(200);

      // token2 should no longer work
      await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: token2 })
        .expect(401);

      // token1 should still work
      await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: token1 })
        .expect(200);
    });

    it("should handle password changes with weak passwords", async () => {
      const registrationData = {
        email: "password-change-flow@example.com",
        password: "initial",
        fullName: "Password Change User",
        phoneNumber: "+254712345685",
        role: "BUYER",
      };

      // Register user
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      const { accessToken } = registerResponse.body.data.tokens;

      // Change to weak password
      const changePasswordResponse = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          currentPassword: "initial",
          newPassword: "123",
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // Login with new weak password
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: registrationData.email,
          password: "123",
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(registrationData.email);
    });
  });

  describe("Error handling in complete flow", () => {
    it("should handle validation errors gracefully", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "", // Empty password
        fullName: "",
        phoneNumber: "invalid",
        role: "INVALID",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toBeDefined();
      expect(Array.isArray(response.body.error.details)).toBe(true);
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });

    it("should handle authentication errors properly", async () => {
      // Try to login with non-existent user
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "123",
        })
        .expect(401);

      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.error.message).toBe(
        "Invalid email or password"
      );

      // Register user first
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "auth-error-test@example.com",
          password: "123",
          fullName: "Auth Error User",
          phoneNumber: "+254712345686",
          role: "BUYER",
        })
        .expect(201);

      // Try to login with wrong password
      const wrongPasswordResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "auth-error-test@example.com",
          password: "wrong",
        })
        .expect(401);

      expect(wrongPasswordResponse.body.success).toBe(false);
      expect(wrongPasswordResponse.body.error.message).toBe(
        "Invalid email or password"
      );
    });
  });
});
