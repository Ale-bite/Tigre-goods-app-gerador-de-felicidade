import { GoogleGenAI } from "@google/genai";
import { SCENE_IDEAS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '' });

export const generateColoringPage = async (): Promise<{ imageUrl?: string; error?: string }> => {
  if (!process.env.API_KEY) {
    return { error: "API Key is not configured. Please ensure process.env.API_KEY is set." };
  }

  // 1. Seleciona uma cena aleatória da lista expandida
  const randomScene = SCENE_IDEAS[Math.floor(Math.random() * SCENE_IDEAS.length)];

  // 2. Prompt altamente específico para o estilo "Tigre Goods"
  const prompt = `
    A high-quality black and white coloring book page for children. 
    Subject: The main character from the "tigre goods" coloring book, which is a cute, round, chibi-style baby tiger. ${randomScene}. 
    Style: Thick, clean, consistent black outlines on a pure white background. 
    No shading, no grayscale, no colors, no gradients. Flat vector line art style. 
    The composition should be centered and clear, suitable for a coloring book.
  `;
  
  try {
    // Usando gemini-2.5-flash-image com structure simplificada para evitar erros de RPC
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt, // Passando string direta para maior compatibilidade
      config: {
        imageConfig: {
          aspectRatio: '3:4', // Formato retrato
        }
      }
    });

    let imageUrl: string | undefined;

    // Iterar pelas partes para encontrar a imagem
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (imageUrl) {
      return { imageUrl };
    } else {
      console.warn("AI response did not contain image data:", response);
      // Verifica se houve resposta de texto explicando recusa
      const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
      if (textPart) {
         return { error: `A IA não gerou a imagem. Resposta: ${textPart}` };
      }
      return { error: "A IA não conseguiu gerar uma imagem automática. Tente clicar novamente." };
    }

  } catch (e: any) {
    console.error("Error generating image:", e);
    // Tratamento de erro aprimorado
    let errorMessage = "Ocorreu um erro ao gerar a imagem.";
    const msg = e.message || e.toString();
    
    if (msg.includes("429")) {
      errorMessage = "Muitas solicitações. Aguarde um momento e tente novamente.";
    } else if (msg.includes("500") || msg.includes("Rpc failed") || msg.includes("xhr error")) {
      errorMessage = "Erro de conexão com o servidor de IA. Tente novamente em alguns segundos.";
    } else if (msg) {
      errorMessage = `Erro: ${msg.substring(0, 100)}`;
    }
    return { error: errorMessage };
  }
};
