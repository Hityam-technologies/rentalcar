const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../../shared/models/chat.model');
const carService = require('../car/car.service');
const bookingService = require('../booking/booking.service');
const { formatCarListItem } = require('../../shared/utils/carFormatter.util');

const config = require('../../config/env');
const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

const getChatHistory = async (userId) => {
  let chat = await Chat.findOne({ user: userId, appContext: 'user' });
  if (!chat) chat = await Chat.create({ user: userId, appContext: 'user', messages: [] });
  return chat;
};

const buildFallbackResponse = (prompt, cars) => {
  const lower = prompt.toLowerCase();
  let suggestedCars = cars.slice(0, 3);

  if (lower.includes('suv') || lower.includes('family')) {
    suggestedCars = cars.filter((c) => /suv/i.test(c.type)).slice(0, 3);
  } else if (lower.includes('cheap') || lower.includes('budget')) {
    suggestedCars = [...cars].sort((a, b) => a.price - b.price).slice(0, 3);
  }

  const text = suggestedCars.length
    ? `I found ${suggestedCars.length} great options for you: ${suggestedCars.map((c) => c.name).join(', ')}. Tap any car to view details and book.`
    : 'Browse our fleet tab to see all available cars. I can help you pick based on seats, budget, or car type!';

  return {
    text,
    action: suggestedCars.length ? 'show_cars' : null,
    suggestedCars,
    role: 'Concierge',
  };
};

const processUserChat = async (userId, message, context = {}) => {
  const [cars, bookings] = await Promise.all([
    carService.queryCars({ isAvailable: true }),
    bookingService.getUserBookings(userId),
  ]);

  const prompt = message || context.message || '';
  if (!prompt) return { text: 'How can I help you find the perfect ride?', suggestedCars: [] };

  if (!genAI) return buildFallbackResponse(prompt, cars);

  try {
    const chatInstance = await getChatHistory(userId);
    const carsLite = cars.slice(0, 15).map((c) => ({ id: c.id, name: c.name, type: c.type, price: c.price, seats: c.specs?.seats }));
    const bookingsLite = bookings.slice(-5).map((b) => ({ car: b.car?.name, status: b.status }));

    const systemInstruction = `You are the Hityam Car Rental Concierge. Help users find cars and manage bookings.
    Return helpful text. If recommending cars, mention specific names from the fleet.
    User location: ${context.location || 'unknown'}.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
    });

    const history = chatInstance.messages.slice(-8).map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.parts?.[0]?.text || '' }],
    }));

    const chatSession = model.startChat({ history });
    const fullPrompt = `[FLEET]: ${JSON.stringify(carsLite)}\n[BOOKINGS]: ${JSON.stringify(bookingsLite)}\n[QUERY]: ${prompt}`;
    const result = await chatSession.sendMessage(fullPrompt);
    const text = result.response.text();

    chatInstance.messages.push({ role: 'user', parts: [{ text: prompt }] });
    chatInstance.messages.push({ role: 'model', parts: [{ text }] });
    await chatInstance.save();

    const suggestedCars = cars.filter((c) => text.toLowerCase().includes(c.name.toLowerCase())).slice(0, 3);
    return {
      text,
      action: suggestedCars.length ? 'show_cars' : null,
      suggestedCars: suggestedCars.length ? suggestedCars : cars.slice(0, 2),
      role: 'Concierge',
    };
  } catch (err) {
    console.error('[AI User] Gemini error:', err.message);
    return buildFallbackResponse(prompt, cars);
  }
};

const getRecommendations = async (userId) => {
  const bookings = await bookingService.getUserBookings(userId);
  const cars = await carService.queryCars({ isAvailable: true });
  if (!bookings.length) return { carId: cars[0]?.id, reason: 'Popular choice in your area' };
  const lastType = bookings[bookings.length - 1]?.car?.type;
  const match = cars.find((c) => c.type === lastType) || cars[0];
  return { carId: match?.id, reason: `Based on your preference for ${lastType || 'quality'} vehicles` };
};

module.exports = { processUserChat, getRecommendations };
