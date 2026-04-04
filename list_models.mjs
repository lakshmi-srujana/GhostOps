import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// Manual .env.local parsing
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').filter(line => line && !line.startsWith('#')).forEach(line => {
  const [key, ...value] = line.split('=')
  env[key.trim()] = value.join('=').trim()
})

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

async function listModels() {
  try {
    const result = await genAI.listModels();
    console.log('Available Models:');
    result.models.forEach(m => console.log(`- ${m.name}`));
  } catch (err) {
    console.error('❌ Error listing models:', err.message);
  }
}

listModels();
