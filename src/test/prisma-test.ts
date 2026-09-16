import "dotenv/config";
import { prisma } from "../config/db.js";

async function testPrisma() {
  try {
    await prisma.$connect();
    console.log(" Prisma connected to PostgreSQL");

    await prisma.$queryRaw`SELECT 1`;
    console.log(" PostgreSQL query executed successfully");
  } catch (error) {
    console.error(" Prisma/PostgreSQL test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();