import { GeminiProvider } from '../services/llm/geminiProvider.js';

async function testGemini() {
  console.log('Testing GeminiProvider with live GEMINI_API_KEY...');
  const provider = new GeminiProvider();

  // Test 1: Classify Intent
  console.log('\n--- 1. Testing Intent Classification ---');
  const intent1 = await provider.classifyIntent('Can you schedule a meeting with client John tomorrow at 3 PM?');
  console.log('Classified Intent:', intent1);

  // Test 2: Summarize Email
  console.log('\n--- 2. Testing Email Summarization ---');
  const sampleEmail = `Dear Jenish,
We are pleased to inform you that our real estate investment group is ready to proceed with the purchase of the Downtown Commercial Plaza.
Please review the attached purchase agreement and confirm if the closing date of September 30th works for your team. We require your signature by Friday.
Best regards,
Michael Scott, Regional VP`;

  const summary = await provider.summarizeEmail(sampleEmail);
  console.log('Generated AI Summary:\n', summary);

  // Test 3: Draft Reply
  console.log('\n--- 3. Testing Draft Reply ---');
  const draft = await provider.draftReply(sampleEmail, 'Confirm that Sept 30 works and we will send signed agreement tomorrow');
  console.log('Generated Draft Subject:', draft.subject);
  console.log('Generated Draft Body:\n', draft.body);

  console.log('\n✅ All Gemini AI tests completed successfully!');
}

testGemini().catch((err) => {
  console.error('❌ Gemini Test Error:', err);
  process.exit(1);
});
