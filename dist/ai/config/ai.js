"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAI = void 0;
const openai_1 = require("openai");
const agents_1 = require("@openai/agents");
const openRouterClient = new openai_1.OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});
const initializeAI = () => {
    (0, agents_1.setDefaultOpenAIClient)(openRouterClient);
    (0, agents_1.setOpenAIAPI)("chat_completions");
    (0, agents_1.setTracingDisabled)(true);
    console.log("AI initialized with OpenRouter");
};
exports.initializeAI = initializeAI;
