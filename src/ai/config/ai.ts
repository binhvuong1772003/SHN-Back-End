import { OpenAI } from "openai";

import {
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setTracingDisabled,
} from "@openai/agents";

const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});
export const initializeAI = () => {
  setDefaultOpenAIClient(openRouterClient);

  setOpenAIAPI("chat_completions");

  setTracingDisabled(true);

  console.log("AI initialized with OpenRouter");
};
