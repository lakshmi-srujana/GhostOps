import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyBH6jy3pOQ63lbS0l0QzRXCyV4q67U9jOc");

const candidates = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-1.0-pro",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-001"
];

async function hunt() {
  for (const name of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      await model.generateContent("hi");
      console.log(`MATCH_FOUND: ${name}`);
      process.exit(0);
    } catch (e) {
      console.log(`FAIL: ${name} - ${e.message}`);
    }
  }
}

hunt();
