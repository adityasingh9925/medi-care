import bcrypt from "bcryptjs";

async function testBcrypt() {
  const password = "TestPassword123";

  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(
    hashedPassword
      ? "bcrypt hash generation works"
      : "bcrypt hash generation failed"
  );

  const isMatch = await bcrypt.compare(password, hashedPassword);

  console.log(
    isMatch
      ? "bcrypt password comparison works"
      : "bcrypt password comparison failed"
  );
}

testBcrypt();