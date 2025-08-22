import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Users, Upload, Target, Zap, MessageCircle, Globe, BarChart3, Play, UserPlus, CheckCircle, Clock, TrendingUp, Smartphone, Sun, Moon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Navbar from '../components/Navbar';

const Landing = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const themeClasses = {
    bg: isDarkMode ? 'bg-black' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    bgSection: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
    bgCard: isDarkMode ? 'bg-gray-900' : 'bg-white',
    border: isDarkMode ? 'border-gray-800' : 'border-gray-200',
    borderHover: isDarkMode ? 'border-green-500' : 'border-green-600',
    bgCardHover: isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
    borderSection: isDarkMode ? 'border-gray-700' : 'border-gray-300',
    borderFooter: isDarkMode ? 'border-gray-800' : 'border-gray-200',
    bgFooter: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
    bgIcon: isDarkMode ? 'bg-gray-800' : 'bg-gray-200',
    bgIconHover: isDarkMode ? 'bg-green-500' : 'bg-green-600',
  };

  const { firebaseUid } = useUser();
  const navigate = useNavigate();

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (firebaseUid) {
      navigate('/dashboard');
    }
  }, [firebaseUid, navigate]);

  const { t } = useTranslation();

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      <Navbar isDarkMode={isDarkMode} />
      {/* Theme Toggle Button & Language Switcher */}
      <div className="fixed top-24 right-6 z-40 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-16">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">{t('StudyGenie')}</span>
            <br />
            <span className="text-4xl">{t('Personalized Study Guide Generator')}</span>
          </h1>
          <p className={`text-xl ${themeClasses.textSecondary} max-w-4xl mx-auto leading-relaxed`}>
            {t('Turn your books, PDFs, and handwritten notes into quizzes, flashcards, and interactive study guides with AI. Experience personalized learning that adapts to your pace and strengthens your weak areas.')}
          </p>
          <div className="flex justify-center space-x-4 pt-8">
            <Link
              to="/demo"
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Play className="w-5 h-5" />
              <span>{t('Try Demo')}</span>
            </Link>
            <Link
              to="/waitlist"
              className="border-2 border-green-500 text-green-400 px-8 py-4 rounded-lg font-semibold hover:bg-green-500 hover:text-white transition-all duration-300 flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>{t('Join Waitlist')}</span>
            </Link>
          </div>
        </div>

        {/* Hero Illustration Placeholder */}
        <div className="mt-16 relative">
          <div className={`${themeClasses.bgCard} rounded-2xl p-8 border ${themeClasses.border} shadow-2xl`}>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-6xl">📚</div>
              <ArrowRight className="w-8 h-8 text-green-500" />
              <div className="text-6xl">🤖</div>
              <ArrowRight className="w-8 h-8 text-green-500" />
              <div className="text-6xl">🎯</div>
            </div>
            <p className={`text-center mt-4 ${themeClasses.textMuted}`}>{t('AI-powered transformation of your study materials')}</p>
          </div>
        </div>
      </div>

      {/* Problem & Solution Section */}
      <div className={`${themeClasses.bgSection} py-20`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-red-400">{t('The Problem')}</h2>
              <p className={`${themeClasses.textSecondary} text-lg leading-relaxed`}>
                {t('Students struggle with scattered notes, ineffective revision methods, and lack of personalized learning paths. Traditional study methods don\'t adapt to individual strengths and weaknesses, leading to wasted time and poor retention.')}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#74AA9C' }}>{t('The Solution')}</h2>
              <p className={`${themeClasses.textSecondary} text-lg leading-relaxed`}>
                {t('StudyGenie automates the creation of personalized study materials using AI. Upload any content, and get intelligent quizzes, flashcards, and summaries that adapt to your learning style and track your progress.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          {t('Powerful Features for')} <span style={{ color: '#74AA9C' }}>{t('Smart Learning')}</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className={`${themeClasses.bgCard} rounded-2xl p-8 border ${themeClasses.border} hover:${themeClasses.borderHover} transition-colors`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#74AA9C' }}>
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-center">{t('Upload & Extract')}</h3>
            <p className={`${themeClasses.textMuted} text-center`}>
              {t('Upload PDFs, images, or handwritten notes. Our OCR technology extracts text and AI generates comprehensive summaries and quizzes automatically.')}
            </p>
          </div>

          <div className={`${themeClasses.bgCard} rounded-2xl p-8 border ${themeClasses.border} hover:${themeClasses.borderHover} transition-colors`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#74AA9C' }}>
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-center">{t('Personalized Study Flow')}</h3>
            <p className={`${themeClasses.textMuted} text-center`}>
              {t('Tracks your weak and strong subjects, adapts study plans in real-time, and focuses on areas that need the most attention.')}
            </p>
          </div>

          <div className={`${themeClasses.bgCard} rounded-2xl p-8 border ${themeClasses.border} hover:${themeClasses.borderHover} transition-colors`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#74AA9C' }}>
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-center">{t('Smart Flashcard System')}</h3>
            <p className={`${themeClasses.textMuted} text-center`}>
              {t('Spaced repetition algorithm combined with active recall techniques to maximize retention and optimize your study time.')}
            </p>
          </div>

          <div className={`${themeClasses.bgCard} rounded-2xl p-8 border ${themeClasses.border} hover:${themeClasses.borderHover} transition-colors`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#74AA9C' }}>
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-center">{t('AI Tutor')}</h3>
            <p className={`${themeClasses.textMuted} text-center`}>
              {t('RAG-powered Q&A system that answers questions directly from your study materials, providing instant explanations and clarifications.')}
            </p>
          </div>

          <div className={`${themeClasses.bgCard} rounded-2xl p-8 border ${themeClasses.border} hover:${themeClasses.borderHover} transition-colors`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#74AA9C' }}>
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-center">{t('Multilingual Support')}</h3>
            <p className={`${themeClasses.textMuted} text-center`}>
              {t('Support for English, Hindi, Marathi, and more regional languages, making quality education accessible to diverse learners.')}
            </p>
          </div>

          <div className={`${themeClasses.bgCard} rounded-2xl p-8 border ${themeClasses.border} hover:${themeClasses.borderHover} transition-colors`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#74AA9C' }}>
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-center">{t('Progress Dashboard')}</h3>
            <p className={`${themeClasses.textMuted} text-center`}>
              {t('Comprehensive analytics with progress bars, study streaks, knowledge heatmaps, and performance insights to track your growth.')}
            </p>
          </div>
        </div>
      </div>

      {/* Demo Flow Section */}
      <div className={`${themeClasses.bgSection} py-20`}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            {t('How')} <span style={{ color: '#74AA9C' }}>{t('StudyGenie')}</span> {t('Works')}
          </h2>
          
          <div className="space-y-8">
            <div className={`flex items-center space-x-8 ${themeClasses.bgCardHover} rounded-2xl p-8 border ${themeClasses.borderSection}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#74AA9C' }}>
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{t('Upload Your Materials')}</h3>
                <p className={themeClasses.textMuted}>{t('Student uploads a Physics chapter PDF or takes a photo of handwritten notes')}</p>
              </div>
              <div className="text-4xl">📄➡️🤖</div>
            </div>

            <div className={`flex items-center space-x-8 ${themeClasses.bgCardHover} rounded-2xl p-8 border ${themeClasses.borderSection}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#74AA9C' }}>
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{t('AI Processing')}</h3>
                <p className={themeClasses.textMuted}>{t('Our AI analyzes the content and generates personalized flashcards, quizzes, and summaries')}</p>
              </div>
              <div className="text-4xl">⚡🧠💡</div>
            </div>

            <div className={`flex items-center space-x-8 ${themeClasses.bgCardHover} rounded-2xl p-8 border ${themeClasses.borderSection}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#74AA9C' }}>
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{t('Interactive Study')}</h3>
                <p className={themeClasses.textMuted}>{t('Student practices with flashcards and takes quizzes with instant feedback')}</p>
              </div>
              <div className="text-4xl">📚✅❌</div>
            </div>

            <div className={`flex items-center space-x-8 ${themeClasses.bgCardHover} rounded-2xl p-8 border ${themeClasses.borderSection}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#74AA9C' }}>
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{t('Smart Analytics')}</h3>
                <p className={themeClasses.textMuted}>{t('Dashboard updates with progress tracking and AI tutor explains incorrect answers')}</p>
              </div>
              <div className="text-4xl">📊🎯📈</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Outcomes Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          {t('Transform Your')} <span style={{ color: '#74AA9C' }}>{t('Learning Experience')}</span>
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#74AA9C' }}>
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('Faster Revision')}</h3>
            <p className={themeClasses.textMuted}>{t('Cut study time by 50% with AI-optimized materials')}</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#74AA9C' }}>
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('Personalized Learning')}</h3>
            <p className={themeClasses.textMuted}>{t('Adaptive study paths tailored to your strengths and weaknesses')}</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#74AA9C' }}>
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('Better Retention')}</h3>
            <p className={themeClasses.textMuted}>{t('Spaced repetition increases long-term memory by 200%')}</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#74AA9C' }}>
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('Accessibility')}</h3>
            <p className={themeClasses.textMuted}>{t('Regional language support for diverse learners')}</p>
          </div>
        </div>
      </div>

      {/* Technology Stack Section */}
      <div className={`${themeClasses.bgSection} py-20`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">
            {t('Powered by')} <span style={{ color: '#74AA9C' }}>{t('Cutting-Edge Technology')}</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
            {[
              { name: 'LangChain', icon: '🔗' },
              { name: 'OpenAI', icon: '🤖' },
              { name: 'Hugging Face', icon: '🤗' },
              { name: 'Tesseract OCR', icon: '👁️' },
              { name: 'React', icon: '⚛️' },
              { name: 'Node.js', icon: '💚' },
              { name: 'Pinecone', icon: '🌲' },
              { name: 'Firebase', icon: '🔥' }
            ].map((tech, index) => (
              <div key={index} className={`${themeClasses.bgCard} rounded-xl p-4 border ${themeClasses.border} hover:${themeClasses.borderHover} transition-colors`}>
                <div className="text-3xl mb-2">{tech.icon}</div>
                <p className={`text-sm ${themeClasses.textMuted}`}>{t(tech.name)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-8">
          {t('Start Learning Smarter with')} <span style={{ color: '#74AA9C' }}>{t('StudyGenie')}</span>
        </h2>
        <p className={`text-xl ${themeClasses.textSecondary} mb-12 max-w-3xl mx-auto`}>
          {t('Join thousands of students who are already transforming their study habits with AI-powered personalized learning.')}
        </p>
        
        <div className="flex justify-center space-x-6">
          <Link
            to="/demo"
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Play className="w-6 h-6" />
            <span>{t('Try Demo')}</span>
          </Link>
          <Link
            to="/waitlist"
            className="border-2 border-green-500 text-green-400 px-12 py-4 rounded-xl font-bold text-lg hover:bg-green-500 hover:text-white transition-all duration-300 flex items-center space-x-3 transform hover:-translate-y-1"
          >
            <UserPlus className="w-6 h-6" />
            <span>{t('Join Waitlist')}</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className={`${themeClasses.bgFooter} border-t ${themeClasses.borderFooter} py-12`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#74AA9C' }}>{t('StudyGenie')}</h3>
              <p className={themeClasses.textMuted}>{t('Transforming education with AI')}</p>
            </div>
            
            <div className="flex space-x-8">
              <Link to="/about" className={`${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`}>{t('About')}</Link>
              <Link to="/contact" className={`${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`}>{t('Contact')}</Link>
              <Link to="/privacy" className={`${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`}>{t('Privacy')}</Link>
            </div>
            
            <div className="flex space-x-4">
              <div className={`w-10 h-10 rounded-full ${themeClasses.bgIcon} flex items-center justify-center hover:${themeClasses.bgIconHover} transition-colors cursor-pointer`}>
                <span>📧</span>
              </div>
              <div className={`w-10 h-10 rounded-full ${themeClasses.bgIcon} flex items-center justify-center hover:${themeClasses.bgIconHover} transition-colors cursor-pointer`}>
                <span>🐦</span>
              </div>
              <div className={`w-10 h-10 rounded-full ${themeClasses.bgIcon} flex items-center justify-center hover:${themeClasses.bgIconHover} transition-colors cursor-pointer`}>
                <span>💼</span>
              </div>
            </div>
          </div>
          
          <div className={`border-t ${themeClasses.borderFooter} mt-8 pt-8 text-center`}>
            <p className={themeClasses.textMuted}>{t('&copy; 2025 StudyGenie. All rights reserved.')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;