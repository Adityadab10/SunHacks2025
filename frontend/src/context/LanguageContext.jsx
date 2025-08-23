import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const translateContent = async (text, targetLang) => {
    if (!text || !targetLang) {
      console.error('Missing required parameters:', { text, targetLang });
      return text;
    }

    try {
      console.log('Translating:', { text, targetLang }); // Debug log
      
      // Make sure the text is a string
      const textToTranslate = text.toString().trim();
      
      if (!textToTranslate) {
        return text;
      }

      const response = await axios.post('https://d4df5616e56e.ngrok-free.app/translate', {
        q: textToTranslate,
        source: 'auto',
        target: targetLang,
        format: 'text'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Translation response:', response.data); // Debug log
      
      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      }
      
      console.warn('Translation unsuccessful:', response.data); // Debug log
      return text; // fallback to original text if translation fails
      
    } catch (error) {
      console.error('Translation error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        text: text,
        targetLang: targetLang
      });
      return text; // fallback to original text if translation fails
    }
  };

  const translateUI = async (lang) => {
    if (lang === 'en') {
      setTranslations({});
      return;
    }

    setIsLoading(true);
    try {
      // Create an object with all UI strings that need translation
      const uiStrings = {
        // Sidebar strings
        dashboard: 'Dashboard',
        profile: 'My Profile',
        upload: 'Upload Materials',
        youtube: 'YouTube Summarizer',
        studyGroup: 'Study Group',
        publicBoards: 'Public Study Boards',
        signOut: 'Sign Out',
        aiPowered: 'AI-Powered Learning',
        
        // Dashboard strings
        welcomeBack: 'Welcome back',
        readyToContinue: 'Ready to continue your learning journey?',
        streak: 'STREAK',
        studyBoardsTitle: 'Study Boards',
        aiGeneratedMaterials: 'AI-generated study materials',
        viewAll: 'View All',
        noStudyBoards: 'No study boards yet',
        createFirstStudyBoard: 'Create your first study board',
        chatSessionsTitle: 'Chat Sessions',
        aiVideoDiscussions: 'AI video discussions',
        noChatSessions: 'No chat sessions yet',
        startFirstAiConversation: 'Start your first AI conversation',
        messages: 'messages',
        recentSummaries: 'Recent Summaries',
        latestYoutubeSummaries: 'Your latest YouTube video summaries',
        noYoutubeSummaries: 'No YouTube summaries yet',
        summarizeFirstVideo: 'Summarize your first video to get started',
        startSummarizing: 'Start Summarizing',
        activityDistribution: 'Activity Distribution',
        weeklyActivity: 'Weekly Activity',
        todayTimeline: "Today's Activity Timeline",
        student: 'Student',
        summarized: 'Summarized'
      };

      // Translate all strings in parallel
      const translationPromises = Object.entries(uiStrings).map(async ([key, value]) => {
        try {
          const translatedText = await translateContent(value, lang);
          return [key, translatedText];
        } catch (error) {
          console.error(`Failed to translate "${key}":`, error);
          return [key, value]; // fallback to original text
        }
      });

      // Wait for all translations to complete
      const translatedEntries = await Promise.all(translationPromises);
      const translatedStrings = Object.fromEntries(translatedEntries);

      setTranslations(translatedStrings);
    } catch (error) {
      console.error('UI translation error:', error);
      // On error, keep the original strings
      setTranslations({});
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    await translateUI(lang);
  };

  useEffect(() => {
    translateUI(currentLanguage);
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      changeLanguage, 
      translations,
      isLoading,
      translateContent
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
