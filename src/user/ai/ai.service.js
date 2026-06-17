const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../../shared/models/chat.model');
const carService = require('../car/car.service');
const bookingService = require('../booking/booking.service');

const config = require('../../config/env');
const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

const ASSISTANT_ROLE = 'Concierge';
const MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryDelayMs = (err) => {
  const msg = err?.message || '';
  const secondsMatch = msg.match(/retry in ([\d.]+)s/i);
  if (secondsMatch) return Math.min(Math.ceil(parseFloat(secondsMatch[1]) * 1000), 60000);
  const jsonMatch = msg.match(/"retryDelay":"(\d+)s"/);
  if (jsonMatch) return Math.min(parseInt(jsonMatch[1], 10) * 1000, 60000);
  return 5000;
};

const fetchAvailableCars = async () => {
  const result = await carService.queryCars({ isAvailable: true }, { page: 1, limit: 50 });
  return Array.isArray(result) ? result : result.data || [];
};

const getChatHistory = async (userId) => {
  let chat = await Chat.findOne({ user: userId, appContext: 'user' });
  if (!chat) chat = await Chat.create({ user: userId, appContext: 'user', messages: [] });
  return chat;
};

const buildFleetContext = (cars) =>
  cars.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    price: c.price,
    seats: c.specs?.seats,
    transmission: c.specs?.transmission,
    fuel: c.specs?.fuel,
    location: c.location,
  }));

const buildBookingsContext = (bookings) =>
  bookings.slice(-8).map((b) => ({
    car: b.car?.name,
    carId: b.car?.id || b.car?._id,
    status: b.status,
    startDate: b.startDate,
    endDate: b.endDate,
  }));

const buildSystemInstruction = (context, fleetSize, bookingCount) => `You are the Hityam Car Rental concierge — a real conversational AI inside the Hityam car rental app.

Personality: warm, helpful, and natural. You are not a script — every reply should feel written for this specific user and moment. Ask follow-up questions when it helps. Use humor or empathy when appropriate.

What you can help with: finding cars, comparing options, trip planning, pricing, features, locations, booking status, and general rental advice.

Live data: each message includes current FLEET and USER BOOKINGS JSON. Ground answers in that data — use real car names, prices, seats, and booking statuses. Never invent vehicles that are not in the fleet. If nothing fits, say so honestly and explain why.

Scope: stay mostly focused on car rentals and travel. For unrelated topics you may chat briefly, then offer rental help.

Formatting: write plain conversational text only — no JSON, no markdown headers, no bullet lists unless the user asks for a comparison. State prices as plain numbers without currency symbols (e.g. "1500 per day").

User location: ${context.location || 'unknown'}
Fleet size: ${fleetSize} available cars
User booking history: ${bookingCount} past booking(s)`;

const extractMentionedCars = (text, cars) => {
  const lower = text.toLowerCase();
  return cars.filter((c) => lower.includes(c.name.toLowerCase()));
};

const buildContextPayload = (fleetContext, bookingsLite, prompt) => {
  const userLine = prompt || '[User just opened the chat — greet them and offer help]';
  return `[FLEET DATA]
${JSON.stringify(fleetContext)}

[USER BOOKINGS]
${JSON.stringify(bookingsLite)}

[USER MESSAGE]
${userLine}`;
};

const callGemini = async ({ systemInstruction, history, message }) => {
  let lastError;

  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.95 },
        });

        const chatSession = model.startChat({ history });
        const result = await chatSession.sendMessage(message);
        return result.response.text().trim();
      } catch (err) {
        lastError = err;
        const isRateLimited = err.message?.includes('429') || /quota|rate.?limit/i.test(err.message);
        if (isRateLimited && attempt === 0) {
          const delay = parseRetryDelayMs(err);
          console.warn(`[AI User] ${modelName} rate-limited, retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        console.warn(`[AI User] ${modelName} failed:`, err.message);
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
};

const mapGeminiError = (err) => {
  const msg = err?.message || '';
  if (msg.includes('429') || /quota|rate.?limit/i.test(msg)) {
    return 'I\'m temporarily unable to respond — the AI service quota has been reached. Please try again in a minute or update the GEMINI_API_KEY.';
  }
  if (msg.includes('API key') || msg.includes('403')) {
    return 'The AI service key is invalid or lacks access. Please check GEMINI_API_KEY in the server .env file.';
  }
  return 'Sorry, I had trouble thinking that through. Please try again in a moment.';
};

const processUserChat = async (userId, message, context = {}) => {
  const [cars, bookings] = await Promise.all([
    fetchAvailableCars(),
    bookingService.getUserBookings(userId),
  ]);

  const prompt = (message || context.message || '').trim();

  if (!genAI) {
    return {
      text: 'The AI assistant is not available right now. Please set GEMINI_API_KEY in the server environment.',
      action: null,
      suggestedCars: [],
      role: ASSISTANT_ROLE,
    };
  }

  try {
    const chatInstance = await getChatHistory(userId);
    const fleetContext = buildFleetContext(cars);
    const bookingsLite = buildBookingsContext(bookings);
    const systemInstruction = buildSystemInstruction(context, cars.length, bookings.length);

    const history = chatInstance.messages.slice(-10).map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.parts?.[0]?.text || '' }],
    }));

    const contextPayload = buildContextPayload(fleetContext, bookingsLite, prompt);
    const text = await callGemini({ systemInstruction, history, message: contextPayload });

    const savedUserText = prompt || 'Hello';
    chatInstance.messages.push({ role: 'user', parts: [{ text: savedUserText }] });
    chatInstance.messages.push({ role: 'model', parts: [{ text }] });
    await chatInstance.save();

    const suggestedCars = extractMentionedCars(text, cars).slice(0, 3);

    return {
      text,
      action: suggestedCars.length ? 'show_cars' : null,
      suggestedCars,
      role: ASSISTANT_ROLE,
    };
  } catch (err) {
    console.error('[AI User] Gemini error:', err.message);
    return {
      text: mapGeminiError(err),
      action: null,
      suggestedCars: [],
      role: ASSISTANT_ROLE,
    };
  }
};

const getRecommendations = async (userId) => {
  const bookings = await bookingService.getUserBookings(userId);
  const cars = await fetchAvailableCars();
  if (!bookings.length) return { carId: cars[0]?.id, reason: 'Popular choice in your area' };
  const lastType = bookings[bookings.length - 1]?.car?.type;
  const match = cars.find((c) => c.type === lastType) || cars[0];
  return { carId: match?.id, reason: `Based on your preference for ${lastType || 'quality'} vehicles` };
};

module.exports = { processUserChat, getRecommendations };
