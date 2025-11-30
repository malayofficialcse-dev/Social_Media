import request from "supertest";
import app from "../../server.js"; // your express app

describe("User API - Integration", () => {
  
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("token");
  });

  it("should login user", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({
        email: "test@example.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

});
