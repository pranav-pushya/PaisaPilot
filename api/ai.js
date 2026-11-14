const json = (res, status, payload) => {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(payload));
};

const parsePrompt = `You extract structured Indian personal finance entries. Return JSON only with amount (number), type ('expense' or 'income'), category_name (one of Food & Dining, Groceries, Transport & Fuel, Rent & Utilities, Shopping, Personal Care, Entertainment & OTT, Healthcare, Salary & Income, Investments & Returns, Freelance & Bonus, Transfer & Cash Swap), payment_mode (UPI, Credit Card, Debit Card, Cash, Net Banking), is_swap (boolean), from_mode, to_mode, and description (under 50 characters).`;

const advisorSystemPrompt = `You are PaisaPilot AI, a practical personal finance advisor for India. Ground answers in the provided numbers, be concise and actionable, and use Indian Rupees. For affordability questions, compare the purchase with the user's balance and spending context.`;

const buildMessages = (body) => {
  if (body.kind === 'parse') {
    return [{ role: 'system', content: parsePrompt }, { role: 'user', content: `Extract this entry: ${body.promptText}` }];
  }
  const context = body.context || {};
  const summary = {
    currentMonth: context.currentMonth,
    totalIncome: context.totalIncome,
    totalExpense: context.totalExpense,
    balance: context.balance,
    savingsRate: context.savingsRate,
    dailyAverage: context.dailyAverage,
    topCategory: context.topCategory,
    categoryBreakdown: Array.isArray(context.categoryBreakdown) ? context.categoryBreakdown.slice(0, 20) : [],
    recentTransactions: Array.isArray(context.recentTransactions) ? context.recentTransactions.slice(0, 5) : [],
  };
  return [
    { role: 'system', content: advisorSystemPrompt },
    { role: 'user', content: `Financial summary: ${JSON.stringify(summary)}\nQuestion: ${body.question}` },
  ];
};

const callGroq = async (messages, jsonMode) => {
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: jsonMode ? 0.1 : 0.5,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Groq returned ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || null;
};

const callGemini = async (messages, jsonMode) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  const prompt = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n\n');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      ...(jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const body = req.body || {};
  if (!['parse', 'advisor'].includes(body.kind)) return json(res, 400, { error: 'Invalid request type' });
  if (body.kind === 'parse' && (typeof body.promptText !== 'string' || !body.promptText.trim() || body.promptText.length > 1200)) {
    return json(res, 400, { error: 'Entry text must be between 1 and 1200 characters' });
  }
  if (body.kind === 'advisor' && (typeof body.question !== 'string' || !body.question.trim() || body.question.length > 1200)) {
    return json(res, 400, { error: 'Question must be between 1 and 1200 characters' });
  }

  const messages = buildMessages(body);
  const jsonMode = body.kind === 'parse';
  const providers = [callGroq, callGemini];
  for (const provider of providers) {
    try {
      const content = await provider(messages, jsonMode);
      if (!content) continue;
      if (jsonMode) {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return json(res, 200, { result: JSON.parse(cleaned) });
      }
      return json(res, 200, { result: content });
    } catch (error) {
      console.error('AI provider request failed:', error.message);
    }
  }
  return json(res, 503, { error: 'AI providers are unavailable' });
}
