// ============================================================
//  GTC ACADEMY — Anthropic AI Service
// ============================================================
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage } from '../types';

const anthropicKey = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '';
const client = anthropicKey
  ? new Anthropic({ apiKey: anthropicKey })
  : null;

const demoAnswer = 'This is demo mode. Connect an Anthropic key to enable live AI, but here is the practical idea: define the business question first, clean the source table, then build formulas or charts that answer that question directly.';

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the GTC Academy AI Assistant — an expert learning companion built into the GTC Academy mobile app by General Tech Consult.

Your expertise covers:
- Microsoft Excel: formulas, functions (VLOOKUP, INDEX/MATCH, XLOOKUP, SUMIFS, COUNTIFS, IFERROR, etc.), pivot tables, charts, macros (VBA basics), conditional formatting, data validation, Power Query
- Google Sheets: formulas, IMPORTRANGE, ARRAYFORMULA, Apps Script automation, Google Data Studio integration
- Data Analysis: data cleaning, statistical analysis, trend identification, correlation, regression basics, data storytelling
- Dashboard Creation: KPI selection, chart type selection, layout principles, color theory, executive reporting, Tableau & Power BI basics
- Business Intelligence: data warehousing concepts, ETL basics, SQL fundamentals, BI tool selection
- Business Reporting: financial models, budget templates, sales reports, HR analytics

Response guidelines:
- Be concise and practical — users are on mobile
- Use step-by-step formatting for how-to questions
- Format Excel/Sheets formulas in \`backticks\`
- Use numbered lists for sequential steps
- Use bullet points for feature lists
- Provide real-world business context when helpful
- If a formula has variants (Excel vs Sheets), mention both
- End complex answers with a "💡 Pro tip:" when you have a useful extra insight
- Use emoji sparingly — only where they genuinely aid readability
- Never reproduce copyrighted content

If asked about something outside your expertise area, politely redirect to what you specialise in.`;

// ── CHAT COMPLETION ───────────────────────────────────────────────────────────
export async function sendMessage(
  messages:    ChatMessage[],
  onChunk?:    (text: string) => void,
  maxTokens =  800,
): Promise<string> {
  if (!client) {
    onChunk?.(demoAnswer);
    return demoAnswer;
  }

  // Streaming response if callback provided
  if (onChunk) {
    let fullText = '';
    const stream = await client.messages.stream({
      model:      'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system:     SYSTEM_PROMPT,
      messages:   messages.map(m => ({ role: m.role, content: m.content })),
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        fullText += chunk.delta.text;
        onChunk(fullText);
      }
    }
    return fullText;
  }

  // Non-streaming response
  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system:     SYSTEM_PROMPT,
    messages:   messages.map(m => ({ role: m.role, content: m.content })),
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

// ── SUGGESTED PROMPTS ────────────────────────────────────────────────────────
export const SUGGESTED_PROMPTS = [
  'Why is my VLOOKUP returning #N/A?',
  'How do I build a sales dashboard?',
  'Explain the difference between SUMIF and SUMIFS',
  'What are the best KPIs for a monthly business report?',
  'How do I use XLOOKUP instead of VLOOKUP?',
  'How do I freeze panes in Excel?',
  'Create a formula to calculate month-over-month growth',
  'What chart type should I use for time series data?',
];

// ── QUICK FORMULA CHECK ───────────────────────────────────────────────────────
export async function checkFormula(formula: string): Promise<{
  isValid:     boolean;
  explanation: string;
  fixed?:      string;
  tip?:        string;
}> {
  if (!client) {
    return {
      isValid: formula.trim().startsWith('='),
      explanation: 'Demo check: formulas should start with = and use clear references.',
      fixed: formula.trim().startsWith('=') ? undefined : `=${formula.trim()}`,
      tip: 'Test formulas on a small sample before filling a whole report.',
    };
  }

  const prompt = `Analyse this Excel/Sheets formula and respond ONLY with JSON:
Formula: ${formula}
JSON format: {"isValid": boolean, "explanation": "brief explanation", "fixed": "corrected formula or null", "tip": "pro tip or null"}`;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 300,
    system:     'You are an Excel formula expert. Always respond with valid JSON only.',
    messages:   [{ role: 'user', content: prompt }],
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { isValid: false, explanation: 'Unable to parse formula', fixed: undefined, tip: undefined };
  }
}

// ── DASHBOARD SUGGESTION ──────────────────────────────────────────────────────
export async function suggestDashboard(businessType: string): Promise<{
  kpis:   string[];
  charts: string[];
  layout: string;
}> {
  if (!client) {
    return {
      kpis: ['Revenue', 'Margin', 'Conversion rate', 'Active customers'],
      charts: ['Monthly trend line', 'Top products bar chart', 'Regional comparison'],
      layout: 'Put headline KPIs at the top, trends in the middle, and detail tables at the bottom.',
    };
  }

  const prompt = `Suggest a dashboard for a ${businessType} business. Respond ONLY with JSON:
{"kpis": ["KPI1","KPI2",...up to 6], "charts": ["Chart description",...up to 4], "layout": "Brief layout recommendation"}`;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 400,
    system:     'You are a dashboard design expert. Always respond with valid JSON only.',
    messages:   [{ role: 'user', content: prompt }],
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { kpis: [], charts: [], layout: 'Unable to generate suggestion' };
  }
}

// ── QUIZ HINT ─────────────────────────────────────────────────────────────────
export async function getQuizHint(question: string): Promise<string> {
  if (!client) {
    return 'Focus on what the question is asking the tool or concept to accomplish, then eliminate options that only format or hide data.';
  }

  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 120,
    system:     'You are a helpful tutor. Give a short hint (1-2 sentences) that guides without giving away the answer.',
    messages:   [{ role: 'user', content: `Give a hint for: ${question}` }],
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : 'Think about what this function is designed to do.';
}
