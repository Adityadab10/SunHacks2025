import { motion } from "framer-motion"
import { Upload, Target, MessageCircle, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { LampContainer } from "../components/ui/lamp"
import { Link } from "react-router-dom"
import { useState } from "react"
import Navbar from "../components/Navbar"

export default function Landing() {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(true)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Theme-aware styling
  const themeClasses = isDarkMode
    ? {
        bg: "bg-black",
        text: "text-white",
        textSecondary: "text-gray-400",
        cardBg: "bg-gray-900/50",
        cardBorder: "border-gray-800",
        cardHover: "hover:bg-gray-800/50",
        stepBg: "bg-gray-800/50",
        stepBorder: "border-gray-700",
        finalBg: "bg-black",
      }
    : {
        bg: "bg-white",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        cardBg: "bg-gray-50/50",
        cardBorder: "border-gray-200",
        cardHover: "hover:bg-gray-100/50",
        stepBg: "bg-gray-100/50",
        stepBorder: "border-gray-300",
        finalBg: "bg-gray-50",
      }

  return (
    <div
      className={`min-h-screen pt-16 ${themeClasses.bg} ${themeClasses.text}`}
    >
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Hero Section with Lamp Effect - NOW PROPERLY RECEIVES THEME */}
      <LampContainer isDarkMode={isDarkMode}>
        <motion.div
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 40 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="text-center space-y-8 max-w-4xl mx-auto mt-24"
        >
          <h1
            className={`py-4 bg-clip-text text-center text-5xl md:text-7xl font-bold tracking-tight text-transparent leading-tight ${
              isDarkMode
                ? "bg-gradient-to-br from-slate-300 to-slate-500"
                : "bg-gradient-to-br from-gray-700 to-gray-900"
            }`}
          >
            <span className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7f] bg-clip-text text-transparent">
              PadhAI
            </span>
            <br />
            <span
              className={`text-4xl md:text-6xl bg-clip-text text-transparent ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-300 to-gray-500"
                  : "bg-gradient-to-br from-gray-600 to-gray-800"
              }`}
            >
              {t("Smarter Learning, Simplified")}
            </span>
          </h1>

          <p
            className={`text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed ${themeClasses.textSecondary}`}
          >
            {t(
              "AI-powered study assistant that turns YouTube, PDFs, and notes into personalized learning boards."
            )}
          </p>

          <div className="flex justify-center pt-8">
            <Link
              to="/login"
              className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7f] hover:from-[#5a8a7f] hover:to-[#74AA9C] text-white font-semibold px-10 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#74AA9C]/25 flex items-center space-x-3 group"
            >
              <span>{t("Get Started")}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </LampContainer>

      {/* Features Preview */}
      <section className="pb-20 px-6 max-w-6xl mx-auto">
        <h2
          className={`text-3xl font-bold text-center mb-12 ${themeClasses.text}`}
        >
          {t("Powerful Features for")}{" "}
          <span className="text-[#74AA9C]">{t("Smart Learning")}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Upload className="w-8 h-8" />,
              title: t("Upload & Extract"),
              description: t(
                "Upload PDFs, images, or handwritten notes. Our OCR technology extracts text and AI generates comprehensive summaries and quizzes automatically."
              ),
            },
            {
              icon: <Target className="w-8 h-8" />,
              title: t("Personalized Study Flow"),
              description: t(
                "Tracks your weak and strong subjects, adapts study plans in real-time, and focuses on areas that need the most attention."
              ),
            },
            {
              icon: <MessageCircle className="w-8 h-8" />,
              title: t("AI Tutor"),
              description: t(
                "RAG-powered Q&A system that answers questions directly from your study materials, providing instant explanations and clarifications."
              ),
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`text-center space-y-4 p-8 rounded-xl border ${themeClasses.cardBorder} hover:border-[#74AA9C]/50 transition-all duration-300 ${themeClasses.cardBg} backdrop-blur-sm ${themeClasses.cardHover}`}
            >
              <div className="w-16 h-16 rounded-full bg-[#74AA9C] flex items-center justify-center mx-auto text-white">
                {feature.icon}
              </div>
              <h3 className={`text-xl font-semibold ${themeClasses.text}`}>
                {feature.title}
              </h3>
              <p
                className={`leading-relaxed ${themeClasses.textSecondary}`}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2
          className={`text-3xl font-bold text-center mb-12 ${themeClasses.text}`}
        >
          {t("How")}{" "}
          <span className="text-[#74AA9C]">PadhAI</span> {t("Works")}
        </h2>
        <div className="space-y-8">
          {[
            {
              step: 1,
              title: t("Upload Your Materials"),
              description: t(
                "Student uploads a Physics chapter PDF or takes a photo of handwritten notes"
              ),
              emoji: "📄➡️🤖",
            },
            {
              step: 2,
              title: t("AI Processing"),
              description: t(
                "Our AI analyzes the content and generates personalized flashcards, quizzes, and summaries"
              ),
              emoji: "⚡🧠💡",
            },
            {
              step: 3,
              title: t("Interactive Study"),
              description: t(
                "Student practices with flashcards and takes quizzes with instant feedback"
              ),
              emoji: "📚✅❌",
            },
            {
              step: 4,
              title: t("Smart Analytics"),
              description: t(
                "Dashboard updates with progress tracking and AI tutor explains incorrect answers"
              ),
              emoji: "📊🎯📈",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`flex items-center space-x-8 ${themeClasses.stepBg} rounded-2xl p-8 border ${themeClasses.stepBorder} hover:border-[#74AA9C]/50 transition-all duration-300`}
            >
              <div className="w-12 h-12 rounded-full bg-[#74AA9C] flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text}`}>
                  {item.title}
                </h3>
                <p className={themeClasses.textSecondary}>
                  {item.description}
                </p>
              </div>
              <div className="text-4xl">{item.emoji}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`py-24 px-6 ${themeClasses.finalBg}`}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className={`text-5xl font-bold mb-8 ${themeClasses.text}`}>
            {t("Start Learning Smarter with")}{" "}
            <span className="text-[#74AA9C]">PadhAI</span>
          </h2>
          <p
            className={`text-xl mb-12 max-w-3xl mx-auto ${themeClasses.textSecondary}`}
          >
            {t(
              "Join thousands of students who are already transforming their study habits with AI-powered personalized learning."
            )}
          </p>

          <div className="flex justify-center">
            <Link
              to="/login"
              className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7f] hover:from-[#5a8a7f] hover:to-[#74AA9C] text-white px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 hover:shadow-xl hover:shadow-[#74AA9C]/25 group"
            >
              <span>{t("Get Started")}</span>
              <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}