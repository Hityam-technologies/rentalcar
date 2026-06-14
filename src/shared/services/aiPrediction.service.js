const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/env');
const logger = require('../../config/logger');

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

/**
 * Generates an AI prediction for a car based on its properties.
 * @param {Object} carData - The car data
 * @returns {Promise<Object|null>} A JSON object containing level, tip, and colorTheme
 */
const generateCarPrediction = async (carData) => {
  if (!genAI) {
    logger.warn('Gemini API Key is missing. Skipping AI prediction.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are an expert AI analyst for a premium car rental platform. Your task is to analyze the details of a specific car and predict its rental demand. You must return EXACTLY a valid JSON object without any markdown wrapping or extra text. The JSON object must contain these exactly three keys: "level" (must be "High", "Medium", or "Low" based on expected demand), "tip" (a short 1-sentence actionable business insight for the admin regarding this car), and "colorTheme" (a hex color code matching the vibe/demand of the car, e.g., #10B981 for High/Eco, #F59E0B for Medium, #EF4444 for Low).',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const prompt = `Please analyze the following car for our rental platform:
Brand: ${carData.brand}
Name: ${carData.name}
Type/Category: ${carData.type} / ${carData.category || ''}
Price Per Day: $${carData.pricePerDay || carData.price || 'unknown'}
Features: ${(carData.features || []).join(', ') || 'Standard'}
Status: ${carData.status}

Output the JSON object:`;

    const result = await model.generateContent(prompt);
    const jsonStr = result.response.text();
    const prediction = JSON.parse(jsonStr);

    // Validate the structure briefly
    if (prediction && prediction.level && prediction.tip && prediction.colorTheme) {
      return prediction;
    }
    return null;
  } catch (error) {
    logger.error('Error generating AI car prediction:', error.message);
    // Fallback for testing when Gemini API hits quota limits
    return {
      level: 'High',
      tip: 'Strong rental interest expected for this vehicle type (Mock Fallback)',
      colorTheme: '#10B981',
    };
  }
};

module.exports = { generateCarPrediction };
