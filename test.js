const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyCBVpswuRLLFYU0wVdSL0i-pA0xa3LF_1E');

async function test() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are an expert AI analyst...',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const result = await model.generateContent('Please output { "hello": "world" }');
    console.log(result.response.text());
  } catch(e) {
    console.error('THE ERROR IS:', e);
  }
}

test();
