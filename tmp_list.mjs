import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyBH6jy3pOQ63lbS0l0QzRXCyV4q67U9jOc");

async function list() {
  try {
    const models = await genAI.listModels();
    console.log("--- AVAILABLE MODELS ---");
    models.models.forEach(m => {
      console.log(`${m.name} - ${m.supportedGenerationMethods}`);
    });
  } catch (e) {
    console.error("List failed:", e.message);
  }
}

list();
