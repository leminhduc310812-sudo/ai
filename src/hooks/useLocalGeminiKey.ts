import { useState, useEffect } from 'react';

const LOCAL_KEY_STORAGE = 'echolingo_local_gemini_api_key';

/**
 * Hook quản lý Gemini API key local-only (chỉ lưu tại máy người dùng qua LocalStorage)
 * Phục vụ cho tính năng Re-generate Study Pack & Chatbot AI
 */
export function useLocalGeminiKey() {
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  const [isSaved, setIsSaved] = useState<boolean>(Boolean(apiKey));

  useEffect(() => {
    try {
      if (apiKey) {
        localStorage.setItem(LOCAL_KEY_STORAGE, apiKey.trim());
        setIsSaved(true);
      } else {
        localStorage.removeItem(LOCAL_KEY_STORAGE);
        setIsSaved(false);
      }
    } catch (e) {
      console.warn('Lỗi lưu Gemini API key vào LocalStorage:', e);
    }
  }, [apiKey]);

  const saveKey = (key: string) => {
    const clean = key.trim();
    setApiKey(clean);
  };

  const clearKey = () => {
    setApiKey('');
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 6)}••••••••${apiKey.slice(-4)}`
    : '';

  return {
    apiKey,
    hasKey: Boolean(apiKey),
    maskedKey,
    saveKey,
    clearKey,
  };
}
