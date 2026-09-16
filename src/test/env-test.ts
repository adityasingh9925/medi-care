import "dotenv/config";

if (process.env.DATABASE_URL) {
  console.log("dotenv is working");
  console.log("DATABASE_URL is loaded");
} else {
  console.log("dotenv is not loading DATABASE_URL");
}