
import { useState } from 'react';

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
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const enhanceImage = async (originalImageBase64: string) => {
    setIsEnhancing(true);
    setEnhancedImage(null);
    setEnhancementError(null);
    setShowApiKeyModal(false);

    try {
      const { mimeType, data } = extractBase64(originalImageBase64);

      const apiResponse = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'enhance',
          image: { mimeType, data }
        })
      });

      if (apiResponse.status === 429) {
        setShowApiKeyModal(true);
        throw new Error("Your API key has exceeded its quota for image enhancement.");
      } else if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || `Server error: ${apiResponse.statusText}`);
      }
      
      const response = await apiResponse.json();
      const enhancedPart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

      if (enhancedPart && enhancedPart.inlineData) {
        const enhancedImageData = enhancedPart.inlineData.data;
        const enhancedMimeType = enhancedPart.inlineData.mimeType;
        const enhancedImageSrc = `data:${enhancedMimeType};base64,${enhancedImageData}`;
        setEnhancedImage(enhancedImageSrc);
      } else {
        // If enhancement returns no image, fall back to the original
        setEnhancedImage(originalImageBase64);
      }
    } catch (error: any) {
      console.error("Enhancement failed:", error);
      setEnhancedImage(originalImageBase64); // Show original on error
      setEnhancementError(error.message || "Failed to enhance image.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const resetEnhancement = () => {
    setIsEnhancing(false);
    setEnhancementError(null);
    setEnhancedImage(null);
    setShowApiKeyModal(false);
  };

  return { 
    isEnhancing, 
    enhancementError, 
    enhancedImage, 
    enhanceImage, 
    resetEnhancement,
    showApiKeyModal,
    closeApiKeyModal: () => setShowApiKeyModal(false)
  };
};
