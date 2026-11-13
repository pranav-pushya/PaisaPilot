// Groq & Gemini AI integration for PaisaPilot AI Co-Pilot

// ----------------------------------------------------
// Key Management
// ----------------------------------------------------
export const getGroqApiKey = () => {
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  const storedKey = localStorage.getItem('paisapilot_groq_key');
  return storedKey || envKey || '';
};

export const isGroqConfigured = () => {
  const key = getGroqApiKey();
  return Boolean(key && !key.includes('your-groq') && key.length > 10);
};

export const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const storedKey = localStorage.getItem('paisapilot_gemini_key');
  return storedKey || envKey || '';
};

export const isGeminiConfigured = () => {
  const key = getGeminiApiKey();
  return Boolean(key && !key.includes('your-gemini-api-key') && key.length > 10);
};

export const isAiConfigured = () => isGroqConfigured() || isGeminiConfigured();

export const getAiProviderName = () => {
  if (isGroqConfigured()) return 'Groq (Llama 3.3)';
  if (isGeminiConfigured()) return 'Google Gemini';
  return 'Offline Intelligent Engine';
};

// ----------------------------------------------------
// 1. Natural Language Parser for expenses
// e.g. "Spent 450 on Swiggy dinner with friends via UPI"
// ----------------------------------------------------
export const parseExpensePrompt = async (promptText) => {
  const groqKey = getGroqApiKey();
  const geminiKey = getGeminiApiKey();

  // 1. Try Groq (Llama 3.3 70B Versatile)
  if (isGroqConfigured()) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert Indian expense extractor. Given a natural language description of an expense or income, extract the structured data as a JSON object with:
- amount: number (e.g. 450)
- type: 'expense' or 'income'
- category_name: best match among ['Food & Dining', 'Groceries', 'Transport & Fuel', 'Rent & Utilities', 'Shopping & Personal', 'Entertainment & OTT', 'Healthcare', 'Salary & Income', 'Investments & Returns', 'Freelance / Side Gig']
- payment_mode: best match among ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking'] (default to 'UPI' if unspecified)
- description: clean, concise description string (max 40 characters)

Respond ONLY with valid JSON. No markdown backticks or explanation.`
            },
            {
              role: 'user',
              content: `Extract from this text: "${promptText}"`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        return {
          amount: Number(parsed.amount) || 0,
          type: parsed.type || 'expense',
          category_name: parsed.category_name || 'Food & Dining',
          payment_mode: parsed.payment_mode || 'UPI',
          description: parsed.description || promptText,
        };
      }
    } catch (err) {
      console.warn('Groq live parsing failed, trying fallback:', err);
    }
  }

  // 2. Try Gemini fallback if configured
  if (isGeminiConfigured()) {
    try {
      const systemInstruction = `You are an expert Indian expense extractor. Given a natural language description of an expense or income, extract the structured data as a JSON object with:
- amount: number (e.g. 450)
- type: 'expense' or 'income'
- category_name: best match among ['Food & Dining', 'Groceries', 'Transport & Fuel', 'Rent & Utilities', 'Shopping & Personal', 'Entertainment & OTT', 'Healthcare', 'Salary & Income', 'Investments & Returns', 'Freelance / Side Gig']
- payment_mode: best match among ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking'] (default to 'UPI' if unspecified)
- description: clean, concise description string

Respond ONLY with valid JSON. No markdown backticks or explanation.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemInstruction}\n\nInput: "${promptText}"` }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          amount: Number(parsed.amount) || 0,
          type: parsed.type || 'expense',
          category_name: parsed.category_name || 'Food & Dining',
          payment_mode: parsed.payment_mode || 'UPI',
          description: parsed.description || promptText,
        };
      }
    } catch (err) {
      console.warn('Gemini live parsing failed, using rule-based fallback:', err);
    }
  }

  // 3. Smart local regex fallback
  return fallbackRuleBasedParser(promptText);
};

const fallbackRuleBasedParser = (text) => {
  const clean = text.toLowerCase();
  
  // Extract amount (matches 450, 450.50, ₹450, rs 450, 450rs, 450/-)
  const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:\/|rs|-)?/i);
  let amount = 0;
  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // Payment mode detection
  let payment_mode = 'UPI';
  if (clean.includes('card') || clean.includes('credit')) payment_mode = 'Credit Card';
  else if (clean.includes('debit')) payment_mode = 'Debit Card';
  else if (clean.includes('cash')) payment_mode = 'Cash';
  else if (clean.includes('net banking') || clean.includes('netbanking')) payment_mode = 'Net Banking';
  else if (clean.includes('upi') || clean.includes('gpay') || clean.includes('phonepe') || clean.includes('paytm')) payment_mode = 'UPI';

  // Category detection
  let category_name = 'Food & Dining';
  let type = 'expense';

  if (clean.includes('salary') || clean.includes('received') || clean.includes('income') || clean.includes('credited')) {
    type = 'income';
    category_name = 'Salary & Income';
  } else if (clean.includes('groceries') || clean.includes('blinkit') || clean.includes('zepto') || clean.includes('instamart') || clean.includes('vegetables') || clean.includes('milk')) {
    category_name = 'Groceries';
  } else if (clean.includes('swiggy') || clean.includes('zomato') || clean.includes('dinner') || clean.includes('lunch') || clean.includes('pizza') || clean.includes('burger') || clean.includes('chai') || clean.includes('tea') || clean.includes('coffee')) {
    category_name = 'Food & Dining';
  } else if (clean.includes('uber') || clean.includes('ola') || clean.includes('auto') || clean.includes('metro') || clean.includes('petrol') || clean.includes('diesel') || clean.includes('fuel') || clean.includes('cab')) {
    category_name = 'Transport & Fuel';
  } else if (clean.includes('rent') || clean.includes('electricity') || clean.includes('wifi') || clean.includes('maintenance') || clean.includes('water')) {
    category_name = 'Rent & Utilities';
  } else if (clean.includes('netflix') || clean.includes('spotify') || clean.includes('movie') || clean.includes('prime') || clean.includes('hotstar')) {
    category_name = 'Entertainment & OTT';
  } else if (clean.includes('medicine') || clean.includes('doctor') || clean.includes('hospital') || clean.includes('pharmacy')) {
    category_name = 'Healthcare';
  } else if (clean.includes('amazon') || clean.includes('flipkart') || clean.includes('myntra') || clean.includes('shoes') || clean.includes('clothes') || clean.includes('shopping')) {
    category_name = 'Shopping & Personal';
  }

  // Clean description
  let description = text.trim();

  return {
    amount: amount || 0,
    type,
    category_name,
    payment_mode,
    description: description.length > 50 ? description.substring(0, 50) : description
  };
};

// ----------------------------------------------------
// 2. Query Financial AI Advisor
// ----------------------------------------------------
export const queryAiAdvisor = async (userQuestion, contextData) => {
  const groqKey = getGroqApiKey();
  const geminiKey = getGeminiApiKey();

  const formattedContext = `
Current Financial Snapshot for ${contextData.currentMonth}:
- Total Monthly Income: ₹${contextData.totalIncome}
- Total Monthly Expenses: ₹${contextData.totalExpense}
- Net Balance: ₹${contextData.balance}
- Savings Rate: ${contextData.savingsRate}%
- Daily Average Expense: ₹${contextData.dailyAverage}
- Highest Expense Category: ${contextData.topCategory?.name || 'N/A'} (₹${contextData.topCategory?.amount || 0})
- Category Breakdown:
${contextData.categoryBreakdown.map(c => `  * ${c.name}: ₹${c.amount} (${c.percentage}%)`).join('\n')}
- Recent Transactions:
${contextData.recentTransactions.slice(0, 5).map(t => `  * ${t.date}: ${t.description || t.category_name} - ₹${t.amount} (${t.type}, ${t.payment_mode})`).join('\n')}
`;

  const systemPrompt = `You are "PaisaPilot AI", a smart, friendly, and practical personal finance advisor for India.
You have real-time access to the user's spending data.
Rules:
1. Ground your answers directly in their numbers (Income, Expenses, Categories, Savings Rate in ₹).
2. Answer questions concisely, using bullet points and bold highlights.
3. If they ask "Can I afford X?", calculate whether it fits into their discretionary surplus without compromising essential savings.
4. Keep the tone encouraging, realistic, and tailored to Indian daily expenses (UPI, Swiggy, rent, groceries, impulse shopping).
5. Never provide generic disclaimers unless necessary; be actionable!`;

  // 1. Try Groq (Llama 3.3 70B Versatile)
  if (isGroqConfigured()) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context:\n${formattedContext}\n\nUser Question: "${userQuestion}"` }
          ],
          temperature: 0.6
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data?.choices?.[0]?.message?.content || 'No response generated.';
      }
    } catch (err) {
      console.warn('Groq advisor query failed, trying fallback:', err);
    }
  }

  // 2. Try Gemini fallback
  if (isGeminiConfigured()) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nContext:\n${formattedContext}\n\nUser Question: "${userQuestion}"` }] }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      }
    } catch (err) {
      console.warn('Gemini API call failed, using intelligent offline response:', err);
    }
  }

  // 3. Realistic Context-Aware Offline Advisor Response
  return generateOfflineAdvisorResponse(userQuestion, contextData);
};

const generateOfflineAdvisorResponse = (question, ctx) => {
  const q = question.toLowerCase();

  if (q.includes('afford') || q.includes('buy') || q.includes('purchase')) {
    const surplus = ctx.balance;
    const match = question.match(/([0-9]+(?:,[0-9]+)*)/);
    const itemAmount = match ? parseInt(match[1].replace(/,/g, '')) : null;

    if (itemAmount) {
      if (itemAmount <= surplus * 0.4) {
        return `✅ **Yes, you can afford it!**\n\n- The purchase of **₹${itemAmount.toLocaleString('en-IN')}** accounts for about **${Math.round((itemAmount / surplus) * 100)}%** of your remaining surplus (₹${surplus.toLocaleString('en-IN')}).\n- Your savings rate will remain healthy. Just make sure no unexpected bills are due before the month ends!`;
      } else if (itemAmount <= surplus) {
        return `⚠️ **You can afford it, but proceed with caution.**\n\n- ₹${itemAmount.toLocaleString('en-IN')} will consume **${Math.round((itemAmount / surplus) * 100)}%** of your current remaining balance (₹${surplus.toLocaleString('en-IN')}).\n- Consider deferring non-essential purchases like dining out or shopping for the rest of this month.`;
      } else {
        return `🛑 **I recommend waiting.**\n\n- This ₹${itemAmount.toLocaleString('en-IN')} expense exceeds your current monthly surplus of **₹${surplus.toLocaleString('en-IN')}**.\n- Buying this now would dip into your reserves or push you into a deficit. Try saving ₹${Math.round(itemAmount / 2).toLocaleString('en-IN')} over the next 2 months instead!`;
      }
    }
    return `To tell you if you can afford it, mention the price (e.g. *"Can I afford a ₹5,000 smart watch?"*). Your current monthly balance is **₹${ctx.balance.toLocaleString('en-IN')}**.`;
  }

  if (q.includes('where') || q.includes('most') || q.includes('category') || q.includes('spending')) {
    if (!ctx.topCategory || ctx.totalExpense === 0) {
      return `You haven't logged significant expenses for ${ctx.currentMonth} yet! Once you add a few transactions, I will analyze your top spending categories.`;
    }
    return `📊 **Your Spending Breakdown for ${ctx.currentMonth}:**\n\n- **Highest Category**: **${ctx.topCategory.name}** at **₹${ctx.topCategory.amount.toLocaleString('en-IN')}** (${ctx.topCategory.percentage}% of all expenses).\n- **Daily Average**: You're spending approx **₹${ctx.dailyAverage.toLocaleString('en-IN')} per day**.\n- **Total Spent so far**: ₹${ctx.totalExpense.toLocaleString('en-IN')}.\n\n💡 *Tip: Check if you can trim 10-15% off ${ctx.topCategory.name} to boost your savings rate from ${ctx.savingsRate}%!*`;
  }

  if (q.includes('save') || q.includes('tip') || q.includes('cut') || q.includes('reduce')) {
    return `💡 **3 Actionable Ways to Save More this Month:**\n\n1. **Audit Food & Dining**: In India, food delivery apps (Swiggy/Zomato) and quick commerce (Blinkit/Zepto) stealthily add delivery & surge fees. Cook 2 extra meals a week.\n2. **Consolidate Subscriptions**: Review OTT and music streaming plans. Swap solo plans for family bundles or pause unused ones.\n3. **UPI "Buffer Rule"**: Delay non-urgent shopping cart items on Amazon/Myntra by 48 hours. Most impulse urges fade by then!`;
  }

  return `👋 **PaisaPilot AI here!**\n\nFor ${ctx.currentMonth}:\n- You have earned **₹${ctx.totalIncome.toLocaleString('en-IN')}** and spent **₹${ctx.totalExpense.toLocaleString('en-IN')}**.\n- Current Savings Rate: **${ctx.savingsRate}%**.\n\nYou can ask me:\n- *"Can I afford ₹4,000 sneakers this week?"*\n- *"Where did most of my money go?"*\n- *"Give me 3 tips to save ₹5,000 this month."*`;
};
