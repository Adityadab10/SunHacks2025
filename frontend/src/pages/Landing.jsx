import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const { firebaseUid } = useUser();
  const navigate = useNavigate();

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (firebaseUid) {
      navigate('/dashboard');
    }
  }, [firebaseUid, navigate]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold mb-6">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">PadhAI</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your AI-powered learning companion that revolutionizes the way you study, 
            learn, and grow. Experience personalized education like never before.
          </p>
          <div className="flex justify-center space-x-4 pt-8">
            <Link
              to="/register"
              className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="text-center space-y-4">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-semibold">AI-Powered Learning</h3>
            <p className="text-gray-400">
              Leverage advanced AI to create personalized learning paths tailored to your unique needs and pace.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-semibold">Smart Study Plans</h3>
            <p className="text-gray-400">
              Get intelligent study schedules and content recommendations based on your learning style and goals.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-semibold">Collaborative Learning</h3>
            <p className="text-gray-400">
              Connect with fellow learners, share knowledge, and grow together in a supportive community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
