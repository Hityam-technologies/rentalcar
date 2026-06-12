const { GoogleGenerativeAI } = require("@google/generative-ai");
const Chat = require('./chat.model');
const adminService = require('../admin/admin.service');
const carService = require('../car/car.service');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get or create chat history for a user
 */
const getChatHistory = async (userId) => {
  let chat = await Chat.findOne({ user: userId });
  if (!chat) {
    chat = await Chat.create({ user: userId, messages: [] });
  }
  return chat;
};

/**
 * Core AI Processing logic - optimized for production
 */
const processAiResponse = async (userId, userRole, prompt) => {
  // 0. Basic Safety Guard
  const sensitiveKeywords = ['delete', 'remove', 'all users', 'user passwords', 'database'];
  if (userRole !== 'admin' && sensitiveKeywords.some(kw => prompt.toLowerCase().includes(kw))) {
    return {
      response: "I'm sorry, I am not authorized to perform administrative actions or share sensitive user data.",
      role: 'System Guard'
    };
  }

  const chatInstance = await getChatHistory(userId);

  let systemInstruction = "";
  let dataContext = "";

  if (userRole === 'admin') {
    // 1. Fetch EVERYTHING in Parallel (Analytics + Fleet + Granular Bookings)
    const bookingService = require('../booking/booking.service');
    const [revenue, bookings, users, availableCars, personalBookings, recentBookings] = await Promise.all([
      adminService.getRevenueAnalytics(),
      adminService.getBookingAnalytics(),
      adminService.getUserAnalytics(),
      carService.queryCars({ isAvailable: true }, {}),
      bookingService.getUserBookings(userId),
      // Fetching last 10 global bookings for granular detail
      require('../booking/booking.model').find().sort({ createdAt: -1 }).limit(10).populate('car user', 'name brand')
    ]);
    
    // 2. Comprehensive Admin Context
    dataContext = `ADMIN DATA CONTEXT:
    1. YOUR PERSONAL RENTALS: ${JSON.stringify(personalBookings.map(b => ({ car: b.car?.name, date: b.startDate })))}
    2. RECENT SYSTEM BOOKINGS: ${JSON.stringify(recentBookings.map(b => ({ car: b.car?.name, user: b.user?.name, date: b.startDate })))}
    3. REVENUE/STATS: Rev $${revenue.totalRevenue}, Bookings: ${JSON.stringify(bookings.statusStats)}
    4. FLEET: ${JSON.stringify(availableCars.slice(0, 10).map(c => ({ name: c.name, seats: c.seatingCapacity })))}`;

    systemInstruction = `You are a "Multi-Persona AI".
    If the user asks about business/revenue, act as "Admin Analyst".
    If they ask about their personal bookings or car availability, act as "Concierge".
    You have access to all granular data (car names, dates, users). 
    Always provide specific names and dates from the context.`;
  } else {
    // 1. Fetch User Data in Parallel
    const bookingService = require('../booking/booking.service');
    const [availableCars, userBookings] = await Promise.all([
      carService.queryCars({ isAvailable: true }, {}),
      bookingService.getUserBookings(userId)
    ]);

    // 2. Compress User Context (Lite Objects + Slicing)
    const availableCarsLite = availableCars.slice(0, 15).map(c => ({
      id: c._id, name: c.name, brand: c.brand, type: c.type, price: c.pricePerDay, seats: c.seatingCapacity
    }));

    const userBookingsLite = userBookings.slice(-5).map(b => ({
      car: b.car ? b.car.name : 'Unknown',
      status: b.status,
      date: b.startDate
    }));

    dataContext = `USER DATA CONTEXT:
    1. PREVIOUS RENTALS: ${JSON.stringify(userBookingsLite)}
    2. AVAILABLE CARS FOR BOOKING: ${JSON.stringify(availableCarsLite)}`;

    systemInstruction = `You are the "CarRental Concierge". 
    [STRICT PRIVACY RULE]: You ONLY have access to THIS user's bookings and the available car fleet.
    You have NO access to total revenue, company analytics, or other users' data.
    If the user asks about business secrets, revenue, or admin stats, politely tell them you only handle bookings and car help.
    Focus on finding the right car for their group size (seats) and recognized loyalty.
    Be friendly and helpful.`;
  }

  // 3. Prepare History
  const history = chatInstance.messages.slice(-10).map(m => ({
    role: m.role === "assistant" ? "model" : m.role,
    parts: [{ text: m.parts?.[0]?.text || "" }]
  }));

  // 4. Optimized Model Initialization with GOOGLE SEARCH access
  const chatModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }], 
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      maxOutputTokens: 800,
      temperature: 0.7,
    }
  });

  const chatSession = chatModel.startChat({
    history: history,
  });

  // 5. Context Injection with flexibility for Web Search
  const fullPrompt = `
    [INTERNAL BUSINESS DATA]
    ${dataContext}
    [/INTERNAL BUSINESS DATA]

    [USER QUERY]
    ${prompt}
    [/USER QUERY]

    INSTRUCTION: If the query is about internal business (revenue, existing fleet), use the [INTERNAL BUSINESS DATA]. 
    If the query is about external information (market trends, new car suggestions, web info), USE THE GOOGLE SEARCH TOOL to find the latest data.
  `;

  const result = await chatSession.sendMessage(fullPrompt);
  const responseText = result.response.text();

  // 6. Update Memory
  chatInstance.messages.push({ role: 'user', parts: [{ text: prompt }] });
  chatInstance.messages.push({ role: 'model', parts: [{ text: responseText }] });
  await chatInstance.save();

  const isPersonalQuery = ['book', 'my', 'rent', 'available', 'car'].some(kw => prompt.toLowerCase().includes(kw));

  return {
    response: responseText,
    role: userRole === 'admin' && !isPersonalQuery ? 'Admin Analyst' : 'Concierge'
  };
};

/**
 * AI-powered car recommendation engine
 */
const getAIRecommendations = async (userId) => {
  const bookingService = require('../booking/booking.service');
  const [availableCars, userBookings] = await Promise.all([
    carService.queryCars({ isAvailable: true }, {}),
    bookingService.getUserBookings(userId)
  ]);

  if (userBookings.length === 0) return null;

  const prompt = `User history: ${JSON.stringify(userBookings.slice(-5))} 
  Available: ${JSON.stringify(availableCars.slice(0, 10))}
  Suggest 1 car (JSON { "carId": "...", "reason": "..." }).`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  try {
    return JSON.parse(result.response.text().replace(/```json|```/g, ''));
  } catch (e) {
    return null;
  }
};

/**
 * Auto pricing optimizer for Admins
 */
const suggestPricingOptimizations = async () => {
  const [revenue, bookings] = await Promise.all([
    adminService.getRevenueAnalytics(),
    adminService.getBookingAnalytics()
  ]);

  const prompt = `Data: Revenue=${JSON.stringify(revenue)}, Popularity=${JSON.stringify(bookings.popularCars)}
  Suggest 3 price optimizations.`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = {
  processAiResponse,
  getAIRecommendations,
  suggestPricingOptimizations
};
