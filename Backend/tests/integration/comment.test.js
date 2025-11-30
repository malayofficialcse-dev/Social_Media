import request from "supertest";
import app from "../../server.js";

let token = "";
let postId = "";

beforeAll(async () => {
  const user = await request(app)
    .post("/api/users/register")
    .send({
      username: "commenter",
      email: "commenter@example.com",
      password: "password"
    });

  token = user.body.token;

  const post = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Post for Comments",
      content: "Testing comments"
    });

  postId = post.body._id;
});

describe("Comment API - Integration", () => {
  it("should create a comment", async () => {
    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        post_id: postId,
        content: "This is a test comment"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("content", "This is a test comment");
  });
});
