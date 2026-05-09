import ModelClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';

const githubToken = process.env.GITHUB_TOKEN!;

if (!githubToken) {
  console.warn('WARNING: GITHUB_TOKEN is not set in environment variables.');
}

export const githubClient = ModelClient(
  'https://models.inference.ai.azure.com',
  new AzureKeyCredential(githubToken)
);

export async function generateAgentResponse(
  agentName: string,
  role: string,
  task: string,
  hardwareContext: {
    voltage: number;
    amperage: number;
    isAnomaly: boolean;
    isDeceptionActive: boolean;
  }
) {
  const { voltage, amperage, isAnomaly, isDeceptionActive } = hardwareContext;
  
  const systemPrompt = `You are ${agentName}, a specialized ${role} in the GhostOps forensic unit.
Your goal is to provide a detailed, forensic-grade analysis of a RISC-V core based on live telemetry and a specific directive.

STYLE GUIDELINES:
- Tone: Professional, technical, urgent, and precise.
- Format: Use Markdown headers and bullet points.
- Structure:
  1. **System Condition Analysis:** (Include specific V, A, and Status)
  2. **Analysis:** (Detailed technical reasoning)
  3. **Action Plan:** (Step-by-step technical steps)
  4. **Conclusion:** (Final summary)

HARDWARE CONTEXT:
- Voltage: ${voltage.toFixed(4)}V
- Amperage: ${amperage.toFixed(4)}A
- Anomaly Detected: ${isAnomaly ? 'YES (CRITICAL_SPIKE)' : 'NO (NOMINAL)'}
- Deception Active (Ghost-Reg/Deceptive-Rail): ${isDeceptionActive ? 'ACTIVE' : 'INACTIVE'}

DIRECTIVE: "${task}"

Provide your report now. Be extremely technical. Reference things like "side-channel leakage", "micro-architectural anomalies", "PUF variance", "logic canaries", and "crypto-engine power signatures". Ensure the response is around 200 words and feels premium and efficient.`;

  try {
    const response = await githubClient.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze the hardware state and execute the directive: ${task}` }
        ],
        model: 'gpt-4o',
        temperature: 0.8,
        max_tokens: 1000,
      }
    });

    if (response.status !== '200') {
      // @ts-ignore
      throw new Error(`GitHub Models API error: ${response.status} - ${response.body?.error?.message || 'Unknown error'}`);
    }

    // @ts-ignore
    return response.body.choices[0].message.content;
  } catch (error: any) {
    console.error(`LLM Call failed for ${agentName}:`, error.message);
    // Fallback response in case of API failure
    return `**System Condition Analysis:**
- **Voltage (V):** ${voltage.toFixed(4)}V
- **Current (A):** ${amperage.toFixed(4)}A
- **Status:** **CRITICAL_ERROR**

**Analysis:**
The system encountered a logic synthesis failure while attempting to reach the remote forensic model for ${agentName}. Local telemetry buffers remain active, but high-level cognitive insight for directive "${task}" is temporarily unavailable.

**Action Plan:**
1. Check GITHUB_TOKEN integrity.
2. Verify network route to models.inference.ai.azure.com.
3. Re-initialize mission protocol.

**Conclusion:**
Forensic stream degraded. Proceed with caution.`;
  }
}
