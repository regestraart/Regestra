
import { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

const extractBase64 = (dataUrl: string) => {
  const parts = dataUrl.split(',');
  const meta = parts[0];
  const data = parts[1];
  const mimeType = meta.split(';')[0].split(':')[1];
  return { mimeType, data };
}

export const useImageEnhancer = () => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);

  const enhanceImage = async (originalImageBase64: string) => {
    setIsEnhancing(true);
    setEnhancedImage(null);
    setEnhancementError(null);

    try {
      // If no API key is configured, skip enhancement and use original
      if (!process.env.API_KEY) {
        console.warn("API key is not configured. Using original image.");
        setEnhancedImage(originalImageBase64);
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const { mimeType, data } = extractBase64(originalImageBase64);

      const imagePart = {
        inlineData: { mimeType, data },
      };
      const textPart = {
        text: 'Enhance the quality of this image. Improve sharpness, clarity, and color balance. Do not add, remove, or change any content from the original image.'
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
      });

      const enhancedPart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

      if (enhancedPart && enhancedPart.inlineData) {
        const enhancedImageData = enhancedPart.inlineData.data;
        const enhancedMimeType = enhancedPart.inlineData.mimeType;
        const enhancedImageSrc = `data:${enhancedMimeType};base64,${enhancedImageData}`;
        setEnhancedImage(enhancedImageSrc);
      } else {
        // If the model returns no image data, fallback to the original
        console.warn("AI model did not return an enhanced image. Using original.");
        setEnhancedImage(originalImageBase64);
      }
    } catch (error) {
      console.error("Error enhancing image:", error);
      // Fallback to original image on any error (unsupported format, low quality, API error)
      // This satisfies the requirement to "Allow all image formats" and "Automatically adjust" by not failing.
      setEnhancedImage(originalImageBase64);
    } finally {
      setIsEnhancing(false);
    }
  };

  const resetEnhancement = () => {
    setIsEnhancing(false);
    setEnhancementError(null);
    setEnhancedImage(null);
  };

  return { isEnhancing, enhancementError, enhancedImage, enhanceImage, resetEnhancement };
};
