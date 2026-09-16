import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  age: z.number().min(18),
});

const validResult = userSchema.safeParse({
  name: "Aditya",
  email: "test@example.com",
  age: 25,
});

const invalidResult = userSchema.safeParse({
  name: "A",
  email: "wrong",
  age: 15,
});

console.log(
  validResult.success
    ? "Zod valid-data validation works"
    : "Zod valid-data validation failed"
);

console.log(
  !invalidResult.success
    ? "Zod invalid-data validation works"
    : "Zod invalid-data validation failed"
);