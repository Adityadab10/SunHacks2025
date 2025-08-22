from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

class StudyPlanGenerator:
    def __init__(self, model='gemini-pro'):
        self.llm = ChatGoogleGenerativeAI(
            model=model,
            temperature=0.7,
            google_api_key=os.getenv('GOOGLE_API_KEY')
        )
        
        # Define the prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are an expert educational advisor specializing in creating personalized study plans. 
            Your task is to generate a comprehensive, actionable study plan based on the student's information.
            
            Important guidelines:
            1. Create a realistic plan that considers the student's available time
            2. Focus on their weak areas while maintaining their strengths
            3. Incorporate their preferred learning styles
            4. Include specific study techniques and resources recommendations
            5. Structure the plan with clear timelines and milestones
            6. Make it motivating and supportive in tone
            
            Format the response with clear sections using markdown-style headers."""),
            ("human", """Create a personalized study plan for me based on the following information:

            Student Information:
            {student_information}
            
            Please generate a comprehensive study plan that will help me achieve my goals.""")
        ])
    
    def generate_study_plan(self, student_info):
        """Generate a personalized study plan based on student information"""
        
        # Format the prompt with student information
        prompt = self.prompt_template.format_messages(
            student_information=student_info
        )
        
        # Get response from the model
        response = self.llm.invoke(prompt)
        
        return response.content


if __name__ == "__main__":
    generator = StudyPlanGenerator()
    
    student_info = {
        "name": "Alex Johnson",
        "subjects": "Mathematics, Physics, Computer Science, English Literature",
        "strengths": "Mathematics, Computer Science - strong problem-solving skills",
        "weaknesses": "Physics concepts, English essay writing",
        "learning_styles": "Visual learning, hands-on projects, group study",
        "study_hours": 15,
        "goals": "Improve Physics grade from B to A, enhance essay writing skills, prepare for coding competitions",
        "interests": "Robotics, creative writing, programming side projects"
    }
    
    try:
        study_plan = generator.generate_study_plan(student_info)
        print("Generated Study Plan:")
        print("=" * 50)
        print(study_plan)
    except Exception as e:
        print(f"Error generating study plan: {e}")
        print("\nMake sure you have:")
        print("1. GOOGLE_API_KEY set in your environment variables")
        print("2. Installed required packages: pip install langchain-google-genai python-dotenv")
        print("3. Enabled the Gemini API in Google Cloud Console")