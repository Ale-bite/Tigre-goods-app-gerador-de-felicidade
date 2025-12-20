import { GoogleGenAI } from "@google/genai";
import { SCENE_IDEAS } from '../constants';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callGenAI = async (model: string, prompt: string) => {
  // CORREÇÃO: Usa qualquer um dos nomes de chave que o Vercel/Vite fornecer
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  
  return await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: '3:4',
        ...(model.includes('pro') ? { imageSize: '1K' } : {}) 
      }
    }
  });
};

const generateWithGemini = async (model: string, prompt: string, onRetry?: (msg: string) => void, attempt = 1): Promise<string> => {
  try {
    const response = await callGenAI(model, prompt);
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Resposta sem imagem.");
  } catch (e: any) {
    const errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e)) + (e.message || '');
    if (errorStr.includes('GenerateRequestsPerDay') || errorStr.includes('PerDay')) {
      throw new Error("DAILY_QUOTA_EXCEEDED");
    }
    if ((errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED')) && attempt <= 3) {
      let delay = Math.pow(2, attempt) * 2000;
      if (onRetry) onRetry(`Servidor ocupado. Aguardando ${Math.round(delay/1000)}s...`);
      await wait(delay);
      return generateWithGemini(model, prompt, onRetry, attempt + 1);
    }
    throw e;
  }
};

export const generateColoringPage = async (onRetry?: (msg: string) => void): Promise<{ imageUrl?: string; error?: string; isQuota?: boolean }> => {
  // CORREÇÃO: Unificando a verificação da chave para evitar o erro de "chave não configurada"
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return { error: "A chave API não foi encontrada no ambiente." };
  }

  const randomScene = SCENE_IDEAS[Math.floor(Math.random() * SCENE_IDEAS.length)];

  // GARANTIA: Prompt específico para o livro Tigre Goods
  const prompt = `
    A high-quality black and white coloring book page for children. 
    Subject: The main character from the "tigre goods" coloring book, which is a cute, round, chibi-style baby tiger character standing on two legs. 
    Action/Scene: The tiger is ${randomScene}. 
    Style: Thick, clean, consistent black outlines on a pure white background. No shading.
  `;
  
  const modelsToTry = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const imageUrl = await generateWithGemini(model, prompt, onRetry);
      return { imageUrl };
    } catch (e: any) {
      lastError = e;
      if (e.message === "DAILY_QUOTA_EXCEEDED") continue;
    }
  }

  const isDailyQuota = lastError?.message === "DAILY_QUOTA_EXCEEDED" || JSON.stringify(lastError).includes('PerDay');
  return { 
    error: isDailyQuota ? "Limite diário gratuito atingido!" : "Muitas solicitações. Aguarde um momento.", 
    isQuota: isDailyQuota 
  };
};
