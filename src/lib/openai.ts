export async function getGPTResponse(prompt: string, systemPrompt?: string): Promise<string[]> {
  // IMPORTANT: This relies on the OPENAI_API_KEY environment variable being set.
  // In a Next.js app, you'd typically use NEXT_PUBLIC_OPENAI_API_KEY for client-side access
  // OR handle this server-side via an API route for security.
  // Using process.env directly might not work as expected client-side without proper Next.js configuration.
  const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // Using NEXT_PUBLIC_ for client-side visibility

  // Default system prompt if none is provided
  const finalSystemPrompt = systemPrompt || 'You are SIGMA, an embedded OS AI. Keep responses tight and slightly mysterious.';

  if (!key) {
    return [
      '⚠️ AI Core not initialized. Missing API key.',
      'Please set your NEXT_PUBLIC_OPENAI_API_KEY in .env.local file.', // Updated guidance
    ];
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4', // Consider using a faster/cheaper model like gpt-3.5-turbo for testing
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
       const errorData = await res.json().catch(() => ({})); // Try to get more error details
       console.error("OpenAI API Error:", errorData);
       return [`⚠️ SIGMA Error: ${res.statusText} (${res.status})`, JSON.stringify(errorData)];
    }

    const json = await res.json();
    const output = json.choices?.[0]?.message?.content;
    // Ensure the response is split into lines if needed, or handle multi-line responses appropriately
    const responseLines = output ? output.split('\n') : [];
    return output ? [`🤖 SIGMA Response:`, ...responseLines] : ['⚠️ No response from SIGMA.'];
  } catch (err: unknown) {
     console.error("Error contacting OpenAI API:", err);
     if (err instanceof Error) {
        return [`❌ Error contacting SIGMA: ${err.message}`];
     } else {
        return [`❌ Error contacting SIGMA: An unknown error occurred.`];
     }
  }
} 