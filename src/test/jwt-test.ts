import jwt from "jsonwebtoken";

const secret = "test-secret";

const payload = {
  userId: 123,
  role: "user",
};

const token = jwt.sign(payload, secret, {
  expiresIn: "1h",
});

console.log(
  token
    ? "JWT token generation works"
    : "JWT token generation failed"
);

try {
  const decoded = jwt.verify(token, secret);

  console.log("JWT verification works");
  console.log("Decoded payload:", decoded);
} catch {
  console.log("JWT verification failed");
}