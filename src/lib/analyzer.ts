import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

let openai: OpenAI | null = null;
let genAI: GoogleGenerativeAI | null = null;

// Initialize OpenAI only if API key is available
if (import.meta.env.VITE_OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });
}

// Initialize Gemini only if API key is available
if (import.meta.env.VITE_GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
}

export interface AnalysisResult {
  verdict: 'True' | 'False' | 'Mixed';
  true_rate: number;
  reasoning: string[];
  sources: string[];
}

export interface CombinedAnalysis {
  true_rate: number;
  verdict: 'True' | 'False' | 'Mixed';
  reasoning: string[];
  sources: string[];
  models: {
    openai: AnalysisResult;
    gemini: AnalysisResult;
  };
}

async function getWebContext(claim: string): Promise<string> {
  try {
    const searchQuery = claim.split(' ').slice(0, 5).join(' ') + ' fact check';
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`);
    const data = await response.json();
    const context = data.Abstract || data.RelatedTopics?.map((t: any) => t.Text).join(' ') || 'No recent data found.';
    return `Recent web context: ${context}`;
  } catch (e) {
    return 'Web search unavailable; using model knowledge.';
  }
}

export async function analyzeWithOpenAI(claim: string, webContext: string = ''): Promise<AnalysisResult> {
  if (!openai) {
    return {
      verdict: 'Mixed',
      true_rate: 50,
      reasoning: ['OpenAI API key not configured'],
      sources: []
    };
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const prompt = `You are a neutral, expert fact-checker. Analyze this claim for truthfulness using logical steps and current web knowledge (as of ${currentDate}). Claim: ${claim}

${webContext}

Steps:
1. Break down the claim into 2-3 key facts.
2. For each fact, reason: Is it verifiable? Cite 1-2 recent sources (real URLs if possible, e.g., from news sites like BBC, Reuters, or official .gov).
3. Assess evidence strength: Strong (multiple corroborating sources), Weak (conflicting/single source), None (unverifiable).
4. Calculate true_rate: Percentage (0-100) based on evidence (e.g., 90% if 2/3 facts strong).

Output ONLY valid JSON: { "verdict": "True" if >70%, "False" if <30%, else "Mixed", "true_rate": 85, "reasoning": ["Bullet 1", "Bullet 2"], "sources": ["https://example.com/source1", "https://example.com/source2"] }.

Be precise, unbiased, and cite diverse sources. Avoid speculation.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      verdict: result.verdict || 'Mixed',
      true_rate: result.true_rate || 50,
      reasoning: result.reasoning || ['Analysis unavailable'],
      sources: result.sources || []
    };
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    return {
      verdict: 'Mixed',
      true_rate: 50,
      reasoning: ['OpenAI analysis temporarily unavailable'],
      sources: []
    };
  }
}

export async function analyzeWithGemini(claim: string, webContext: string = ''): Promise<AnalysisResult> {
  if (!genAI) {
    return {
      verdict: 'Mixed',
      true_rate: 50,
      reasoning: ['Gemini API key not configured'],
      sources: []
    };
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const prompt = `You are a neutral, expert fact-checker. Analyze this claim for truthfulness using logical steps and current web knowledge (as of ${currentDate}). Cross-reference with OpenAI's style for consistency. Use your safety filters but prioritize factual depth. For real-time: Simulate querying search engines for latest data on key facts from claim.

Claim: ${claim}

${webContext}

Steps:
1. Break down the claim into 2-3 key facts.
2. For each fact, reason: Is it verifiable? Cite 1-2 recent sources (real URLs if possible, e.g., from news sites like BBC, Reuters, or official .gov).
3. Assess evidence strength: Strong (multiple corroborating sources), Weak (conflicting/single source), None (unverifiable).
4. Calculate true_rate: Percentage (0-100) based on evidence (e.g., 90% if 2/3 facts strong).

Output ONLY valid JSON: { "verdict": "True" if >70%, "False" if <30%, else "Mixed", "true_rate": 85, "reasoning": ["Bullet 1", "Bullet 2"], "sources": ["https://example.com/source1", "https://example.com/source2"] }.

Be precise, unbiased, and cite diverse sources. Avoid speculation.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      verdict: parsed.verdict || 'Mixed',
      true_rate: parsed.true_rate || 50,
      reasoning: parsed.reasoning || ['Analysis unavailable'],
      sources: parsed.sources || []
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    return {
      verdict: 'Mixed',
      true_rate: 50,
      reasoning: ['Gemini analysis temporarily unavailable'],
      sources: []
    };
  }
}

export async function getAnalysis(postText: string, imageUrl?: string): Promise<CombinedAnalysis> {
  const fullText = postText + (imageUrl ? ` Image: ${imageUrl}` : '');
  const webContext = await getWebContext(postText);
  
  const [openaiRes, geminiRes] = await Promise.all([
    analyzeWithOpenAI(fullText, webContext),
    analyzeWithGemini(fullText, webContext)
  ]);
  
  const avgTrueRate = Math.round((openaiRes.true_rate + geminiRes.true_rate) / 2);
  const verdict = avgTrueRate > 70 ? 'True' : avgTrueRate < 30 ? 'False' : 'Mixed';
  
  // Combine reasoning with labels
  const combinedReasoning = [
    ...openaiRes.reasoning.map(r => `OpenAI: ${r}`),
    ...geminiRes.reasoning.map(r => `Gemini: ${r}`)
  ];
  
  // Combine and deduplicate sources
  const combinedSources = [...new Set([...openaiRes.sources, ...geminiRes.sources])];
  
  return {
    true_rate: avgTrueRate,
    verdict,
    reasoning: combinedReasoning,
    sources: combinedSources,
    models: {
      openai: openaiRes,
      gemini: geminiRes
    }
  };
}