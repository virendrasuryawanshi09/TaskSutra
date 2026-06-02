require('dotenv').config();

const testGroq = async () => {
  console.log('GROQ_API_KEY_ENGINE present:', !!process.env.GROQ_API_KEY_ENGINE);
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY_ENGINE}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: 'Return ONLY this JSON: {"pipeline": [{"$match": {"priority": "High"}}]}' }],
      temperature: 0.1
    })
  });

  console.log('Groq API status:', response.status);
  const data = await response.json();
  
  if (!response.ok) {
    console.error('Groq error:', JSON.stringify(data, null, 2));
    return;
  }
  
  const content = data.choices[0].message.content;
  console.log('Raw response:', content);
  const stripped = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  console.log('Stripped:', stripped);
  
  try {
    const parsed = JSON.parse(stripped);
    console.log('Parsed pipeline:', JSON.stringify(parsed.pipeline));
    console.log('SUCCESS!');
  } catch(e) {
    console.error('JSON parse failed:', e.message);
  }
};

testGroq().catch(console.error);
