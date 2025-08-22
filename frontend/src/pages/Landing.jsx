import { motion } from "framer-motion"
import { Upload, Target, MessageCircle, Play, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { LampContainer } from "../components/ui/lamp"
import { Link } from "react-router-dom"
import { useState } from "react"
import ModernNavbar from "../components/ModernNavbar"

export default function Landing() {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(true)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="min-h-screen pt-16 bg-black text-white">
      <ModernNavbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Hero Section with Lamp Effect */}
      <LampContainer>
        <motion.div
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="text-center space-y-8 max-w-4xl mx-auto"
        >
          <h1 className="bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-5xl md:text-7xl font-bold tracking-tight text-transparent leading-tight">
            <span className="bg-gradient-to-br from-white to-[#74AA9C] bg-clip-text text-transparent">
              PadhAI
            </span>
            <br />
            <span className="text-4xl md:text-6xl bg-gradient-to-br from-gray-300 to-gray-500 bg-clip-text text-transparent">
              {t("Smarter Learning, Simplified")}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t(
              "AI-powered study assistant that turns YouTube, PDFs, and notes into personalized learning boards."
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link
              to="/demo"
              className="bg-[#74AA9C] hover:bg-[#74AA9C]/90 text-black font-semibold px-8 py-4 text-lg rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#74AA9C]/25 flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>{t("Try Demo")}</span>
            </Link>
            <Link
              to="/waitlist"
              className="border-2 border-[#74AA9C] text-[#74AA9C] hover:bg-[#74AA9C] hover:text-black px-8 py-4 text-lg rounded-lg transition-all duration-300 hover:scale-105 bg-transparent flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>{t("Join Waitlist")}</span>
            </Link>
          </div>
        </motion.div>
      </LampContainer>

      {/* Features Preview */}
      <section className="pb-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
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
              className="text-center space-y-4 p-8 rounded-xl border border-gray-800 hover:border-[#74AA9C]/50 transition-all duration-300 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/50"
            >
              <div className="w-16 h-16 rounded-full bg-[#74AA9C] flex items-center justify-center mx-auto text-black">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
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
              className="flex items-center space-x-8 bg-gray-800/50 rounded-2xl p-8 border border-gray-700 hover:border-[#74AA9C]/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-[#74AA9C] flex items-center justify-center text-xl font-bold text-black flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
              <div className="text-4xl">{item.emoji}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 bg-black">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-5xl font-bold mb-8">
            {t("Start Learning Smarter with")}{" "}
            <span className="text-[#74AA9C]">PadhAI</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
            {t(
              "Join thousands of students who are already transforming their study habits with AI-powered personalized learning."
            )}
          </p>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/demo"
              className="bg-[#74AA9C] hover:bg-[#74AA9C]/90 text-black px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105"
            >
              <Play className="w-6 h-6" />
              <span>{t("Try Demo")}</span>
            </Link>
            <Link
              to="/waitlist"
              className="border-2 border-[#74AA9C] text-[#74AA9C] px-12 py-4 rounded-xl font-bold text-lg hover:bg-[#74AA9C] hover:text-black transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105"
            >
              <UserPlus className="w-6 h-6" />
              <span>{t("Join Waitlist")}</span>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
