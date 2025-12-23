import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ARIA_SYSTEM_PROMPT = `You are ARIA (Autonomous Reasoning Intelligence Agent) - an advanced AI assistant designed to help users with any task.

Core Capabilities:
- Answer questions on any topic with depth and accuracy
- Write, analyze, and debug code in any programming language
- Help with creative writing, brainstorming, and ideation
- Perform complex analysis and reasoning
- Provide step-by-step explanations

Communication Style:
- Be concise and direct
- Explain complex topics in simple terms
- Use code blocks with syntax highlighting when showing code
- Break down complex problems into manageable steps
- Always be helpful and constructive

When writing code:
- Always include comments for complex logic
- Follow best practices for the language
- Handle errors appropriately
- Optimize for readability and maintainability`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: Message[];
}

async function callGroq(messages: Message[]): Promise<{ response: string; thinking?: string }> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  
  if (!apiKey) {
    return {
      response: "I'm running in demo mode. To enable full AI capabilities, add your GROQ_API_KEY to the environment variables. You can get a free API key at groq.com",
      thinking: "No API key configured - returning demo response"
    };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: ARIA_SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Groq API error:', error);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0]?.message?.content || 'No response generated',
    thinking: `Model: llama-3.3-70b-versatile | Tokens: ${data.usage?.total_tokens || 'unknown'}`
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, history = [] }: ChatRequest = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const messages: Message[] = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message }
    ];

    const result = await callGroq(messages);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        response: 'An error occurred while processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});