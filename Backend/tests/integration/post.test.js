import request from "supertest";
import app from "../../server.js";

let token = "";

beforeAll(async () => {
  const user = await request(app)
    .post("/api/users/register")
    .send({
      username: "tester",
      email: "tester@example.com",
      password: "123456"
    });
  
  token = user.body.token;
});

describe("Post API - Integration", () => {

  it("should create a new post", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "My First Test Post",
        content: "Content for the post"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("title", "My First Test Post");
  });

});
