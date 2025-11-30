import { registerUser } from "../../controllers/userController.js";

describe("User Registration - Unit Test", () => {
  it("should return error if fields missing", async () => {
    const req = {
      body: { username: "", email: "", password: "" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "All fields are required"
    });
  });
});
