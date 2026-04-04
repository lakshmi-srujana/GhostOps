import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').filter(line => line && !line.startsWith('#')).forEach(line => {
  const [key, ...value] = line.split('=')
  env[key.trim()] = value.join('=').trim()
})

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}...`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, respond with 'Success'");
    console.log(`✅ ${modelName} Response: ${result.response.text().trim()}`);
  } catch (err) {
    console.error(`❌ ${modelName} Failure: ${err.message}`);
  }
}

async function runTests() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-2.0-flash-exp");
  await testModel("gemini-2.5-flash");
}

runTests();
