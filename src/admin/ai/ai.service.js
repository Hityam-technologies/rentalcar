const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../../shared/models/chat.model');
const dashboardService = require('../dashboard/dashboard.service');
const adminBookingService = require('../booking/booking.service');
const adminCarService = require('../car/car.service');

const config = require('../../config/env');
const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

const ASSISTANT_NAME = 'Hityam Admin AI';
const ASSISTANT_TAGLINE = 'Your fleet intelligence partner';
const SUGGESTED_PROMPTS = [
  'Summarize today\'s revenue performance',
  'Which cars need maintenance attention?',
  'Show pending bookings requiring approval',
  'Suggest pricing optimizations for SUVs',
];

const getChatHistory = async (userId) => {
  let chat = await Chat.findOne({ user: userId, appContext: 'admin' });
  if (!chat) chat = await Chat.create({ user: userId, appContext: 'admin', messages: [] });
  return chat;
};

const buildFallbackResponse = (prompt, stats, bookings) => {
  const lower = prompt.toLowerCase();
  let text = `Revenue today: $${stats.heroStats?.todayRevenue || 0}. Fleet utilization: ${stats.heroStats?.fleetUtilization || 0}%.`;
  let action = null;
  let permissions = null;

  if (lower.includes('pending') || lower.includes('approve')) {
    const pending = bookings.filter((b) => b.status === 'Pending');
    text = `You have ${pending.length} pending booking(s) requiring review.`;
    action = { type: 'autoNavigate', screen: 'Bookings', filter: 'Pending' };
  } else if (lower.includes('revenue') || lower.includes('performance')) {
    text = `Today's revenue is $${stats.heroStats?.todayRevenue || 0} (${stats.heroStats?.todayRevenueDelta || 0}% vs yesterday). ${stats.quickStats?.carsOnRent || 0} cars currently on rent.`;
  } else if (lower.includes('pricing')) {
    text = 'Consider raising weekend SUV rates by 8-12% based on current demand trends.';
    action = { type: 'suggestion', category: 'pricing' };
  }

  return { text, action, permissions, role: 'Admin Analyst', assistantName: ASSISTANT_NAME };
};

const processAdminChat = async (userId, message) => {
  const prompt = message || '';
  const [stats, insights, bookings, cars] = await Promise.all([
    dashboardService.getDashboardStats(),
    dashboardService.getDashboardInsights(),
    adminBookingService.getAllBookings(),
    adminCarService.queryCars(),
  ]);

  if (!prompt) {
    return {
      text: 'Hello! I\'m your admin assistant. Ask me about revenue, fleet, or bookings.',
      action: null,
      permissions: null,
      suggestedPrompts: SUGGESTED_PROMPTS,
      assistantName: ASSISTANT_NAME,
      assistantTagline: ASSISTANT_TAGLINE,
    };
  }

  const destructiveKeywords = ['delete all', 'remove all users', 'drop database'];
  if (destructiveKeywords.some((kw) => prompt.toLowerCase().includes(kw))) {
    return {
      text: 'This action requires elevated permissions. Please confirm via the admin settings panel.',
      action: null,
      permissions: { required: 'super_admin', action: 'destructive' },
      role: 'Admin Analyst',
    };
  }

  if (!genAI) return buildFallbackResponse(prompt, stats, bookings);

  try {
    const chatInstance = await getChatHistory(userId);
    const dataContext = JSON.stringify({
      stats: stats.heroStats,
      quickStats: stats.quickStats,
      topCars: insights.topCars,
      pendingBookings: bookings.filter((b) => b.status === 'Pending').length,
      fleetCount: cars.length,
    });

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `You are ${ASSISTANT_NAME}, an admin AI for Hityam car rental. Provide actionable business insights using the data context. Be concise and specific.`,
      generationConfig: { maxOutputTokens: 800, temperature: 0.6 },
    });

    const history = chatInstance.messages.slice(-8).map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.parts?.[0]?.text || '' }],
    }));

    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(`[DATA]: ${dataContext}\n[QUERY]: ${prompt}`);
    const text = result.response.text();

    chatInstance.messages.push({ role: 'user', parts: [{ text: prompt }] });
    chatInstance.messages.push({ role: 'model', parts: [{ text }] });
    await chatInstance.save();

    let action = null;
    if (/navigate|view|open/i.test(text) && /booking/i.test(text)) {
      action = { type: 'autoNavigate', screen: 'Bookings' };
    }

    return { text, action, permissions: null, role: 'Admin Analyst', assistantName: ASSISTANT_NAME };
  } catch (err) {
    console.error('[AI Admin] Gemini error:', err.message);
    return buildFallbackResponse(prompt, stats, bookings);
  }
};

const getInitialData = () => ({
  ASSISTANT_NAME,
  ASSISTANT_TAGLINE,
  SUGGESTED_PROMPTS,
});

module.exports = { processAdminChat, getInitialData, SUGGESTED_PROMPTS };
