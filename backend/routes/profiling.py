"""
Profiling endpoint – analyses user survey answers and returns top 3 career matches.
Uses mock data for now; can be swapped for OpenAI integration.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ProfileRequest(BaseModel):
    answers: dict[str, str]


from typing import List, Optional

class CareerMatch(BaseModel):
    id: str
    title: str
    emoji: str
    matchPercent: int
    field: str
    whyItFits: str
    skills: List[str]
    challenges: List[str]
    dayInLife: str
    isAligned: Optional[bool] = None
    isAdvanced: Optional[bool] = None


class ProfileResponse(BaseModel):
    matches: List[CareerMatch]


# ---- Mock career data (to be replaced with OpenAI) ----

MOCK_MATCHES = [
    # --- TECH ---
    CareerMatch(id='swe', title='Software Engineer', emoji='💻', matchPercent=94, field='tech', whyItFits='Your analytical thinking and love for problem-solving align perfectly with software engineering.', skills=['Algorithms', 'System Design', 'Full-Stack'], challenges=['Keeping up with tech', 'Debugging'], dayInLife='Coding and meetings.'),
    CareerMatch(id='devops', title='DevOps Engineer', emoji='⚙️', matchPercent=85, field='tech', whyItFits='You love automating things and infrastructure.', skills=['Docker', 'CI/CD', 'Cloud'], challenges=['On-call incidents'], dayInLife='Writing infrastructure code.'),
    CareerMatch(id='swe_senior', title='Senior Engineering Manager', emoji='🛠️', matchPercent=88, field='tech', whyItFits='You excel at system architecture and team leadership.', skills=['Technical Leadership', 'System Design', 'Agile'], challenges=['People management vs coding'], dayInLife='Architecture planning and 1-on-1s.', isAdvanced=True),
    CareerMatch(id='ai_researcher', title='AI/ML Engineer', emoji='🧠', matchPercent=91, field='tech', whyItFits='You love the cutting edge of algorithms and neural networks.', skills=['Python', 'PyTorch', 'Linear Algebra'], challenges=['Model hallucinations'], dayInLife='Training models.'),
    
    # --- DATA ---
    CareerMatch(id='datascience', title='Data Scientist', emoji='📊', matchPercent=87, field='data', whyItFits='You have a strong curiosity for patterns.', skills=['Machine Learning', 'Statistics', 'SQL'], challenges=['Cleaning messy data'], dayInLife='Exploratory data analysis.'),
    CareerMatch(id='dataanalyst', title='Data Analyst', emoji='📈', matchPercent=82, field='data', whyItFits='You enjoy turning raw data into clear stories.', skills=['Excel', 'SQL', 'Tableau'], challenges=['Dirty data'], dayInLife='Dashboard building.'),
    CareerMatch(id='data_director', title='Director of Data Analytics', emoji='📉', matchPercent=86, field='data', whyItFits='You drive data-driven strategies at the organizational level.', skills=['Data Strategy', 'Team Building', 'Business Analytics'], challenges=['Aligning data with business goals'], dayInLife='Strategy meetings and cross-functional alignment.', isAdvanced=True),
    
    # --- DESIGN ---
    CareerMatch(id='uxdesign', title='UX Designer', emoji='🎨', matchPercent=78, field='design', whyItFits='Empathy for users and creative instincts.', skills=['Figma', 'User Research'], challenges=['Balancing user vs business goals'], dayInLife='Wireframing.'),
    CareerMatch(id='graphicdesign', title='Graphic Designer', emoji='🖌️', matchPercent=80, field='design', whyItFits='Strong visual eye and love for colors.', skills=['Photoshop', 'Illustrator'], challenges=['Client feedback'], dayInLife='Designing social media creatives.'),
    CareerMatch(id='design_lead', title='Lead Product Designer', emoji='✨', matchPercent=85, field='design', whyItFits='You elevate design systems and mentor junior designers.', skills=['Design Systems', 'UX Strategy', 'Figma'], challenges=['Maintaining consistency across teams'], dayInLife='Design reviews and strategy planning.', isAdvanced=True),
    CareerMatch(id='animator', title='3D Animator / VFX Artist', emoji='🎞️', matchPercent=79, field='design', whyItFits='You bring static models to life and love cinematic visuals.', skills=['Maya', 'Blender', 'After Effects'], challenges=['Render times', 'Frame-by-frame tedium'], dayInLife='Keyframe animating a character running.'),
    CareerMatch(id='architect', title='Architect', emoji='🏛️', matchPercent=83, field='design', whyItFits='You balance aesthetics with structural physics.', skills=['AutoCAD', 'Spatial Design', 'Building Codes'], challenges=['Strict regulations'], dayInLife='Drafting floor plans.'),

    # --- BUSINESS ---
    CareerMatch(id='productmanager', title='Product Manager', emoji='🚀', matchPercent=88, field='business', whyItFits='You think big-picture and love strategy.', skills=['Product Strategy', 'Agile'], challenges=['Saying no to features'], dayInLife='Sprint planning and writing PRDs.'),
    CareerMatch(id='marketing', title='Marketing Manager', emoji='📣', matchPercent=81, field='business', whyItFits='Creative, data-aware, love crafting messages.', skills=['Digital Marketing', 'SEO'], challenges=['Proving ROI'], dayInLife='Campaign planning.'),
    CareerMatch(id='founder', title='Startup Founder / CEO', emoji='👑', matchPercent=92, field='business', whyItFits='You have high risk tolerance and visionary leadership.', skills=['Fundraising', 'Vision', 'Execution'], challenges=['Extreme stress', 'Uncertainty'], dayInLife='Pitching investors and hiring.', isAdvanced=True),
    CareerMatch(id='hr_manager', title='HR Manager', emoji='🤝', matchPercent=76, field='business', whyItFits='You deeply care about people culture and organizational health.', skills=['Conflict Resolution', 'Recruiting', 'Labor Laws'], challenges=['Difficult terminations'], dayInLife='Conducting interviews and resolving disputes.'),

    # --- LAW ---
    CareerMatch(id='corporatelawyer', title='Corporate Lawyer', emoji='⚖️', matchPercent=85, field='law', whyItFits='Strong analytical skills, enjoy negotiating.', skills=['Contract Drafting', 'Negotiation'], challenges=['Long hours'], dayInLife='Reviewing merger agreements.'),
    CareerMatch(id='legalanalyst', title='Legal Analyst', emoji='📋', matchPercent=78, field='law', whyItFits='You enjoy research and organizing information.', skills=['Legal Research', 'Case Management'], challenges=['Large volumes of documents'], dayInLife='Organizing case files.'),
    CareerMatch(id='partner_law', title='Law Firm Partner', emoji='🏛️', matchPercent=89, field='law', whyItFits='You excel at client acquisition and high-stakes strategy.', skills=['Business Development', 'Litigation Strategy'], challenges=['Revenue targets'], dayInLife='Client meetings and court appearances.', isAdvanced=True),

    # --- MEDICAL ---
    CareerMatch(id='doctor', title='Physician / Surgeon', emoji='🩺', matchPercent=90, field='medical', whyItFits='Deeply empathetic and enjoy helping people.', skills=['Clinical Diagnosis', 'Anatomy'], challenges=['Long education path'], dayInLife='Morning rounds and seeing patients.'),
    CareerMatch(id='healthadmin', title='Healthcare Administrator', emoji='🏥', matchPercent=76, field='medical', whyItFits='You want to impact healthcare without being clinical.', skills=['Hospital Management', 'Budgeting'], challenges=['Regulatory requirements'], dayInLife='Staffing meetings.'),
    CareerMatch(id='psychologist', title='Clinical Psychologist', emoji='🛋️', matchPercent=82, field='medical', whyItFits='You are an excellent listener and fascinated by human behavior.', skills=['CBT', 'Active Listening', 'Diagnostics'], challenges=['Emotional burnout'], dayInLife='Conducting therapy sessions.'),

    # --- SCIENCE ---
    CareerMatch(id='researcher', title='Research Scientist', emoji='🔬', matchPercent=86, field='science', whyItFits='Endlessly curious, love experimentation.', skills=['Scientific Method', 'Lab Techniques'], challenges=['Securing funding'], dayInLife='Running lab tests.'),
    CareerMatch(id='mech_engineer', title='Mechanical Engineer', emoji='⚙️', matchPercent=84, field='science', whyItFits='You love understanding how physical machines work.', skills=['SolidWorks', 'Thermodynamics', 'Materials Science'], challenges=['Manufacturing constraints'], dayInLife='Designing CAD models of engine parts.'),

    # --- MEDIA ---
    CareerMatch(id='contentcreator', title='Content Creator', emoji='🎬', matchPercent=79, field='media', whyItFits='You love storytelling and connecting with audiences.', skills=['Video Production', 'Editing'], challenges=['Algorithm dependency'], dayInLife='Filming and editing.'),
    CareerMatch(id='journalist', title='Journalist', emoji='📰', matchPercent=77, field='media', whyItFits='Curious, love writing and breaking stories.', skills=['Investigative Research', 'Interviewing'], challenges=['Tight deadlines'], dayInLife='Interviewing sources.'),

    # --- EDUCATION ---
    CareerMatch(id='teacher', title='Teacher / Educator', emoji='📚', matchPercent=83, field='education', whyItFits='Patient, love explaining concepts.', skills=['Curriculum Design', 'Classroom Management'], challenges=['Managing diverse needs'], dayInLife='Teaching classes.'),
    CareerMatch(id='professor', title='University Professor', emoji='🎓', matchPercent=87, field='education', whyItFits='You love deep academic discourse and mentoring adults.', skills=['Lecturing', 'Publishing Papers', 'Grant Writing'], challenges=['Tenure track pressure'], dayInLife='Giving a lecture to 200 students.', isAdvanced=True),

    # --- FINANCE ---
    CareerMatch(id='ca', title='Chartered Accountant', emoji='🧮', matchPercent=84, field='finance', whyItFits='You love numbers and financial analysis.', skills=['Taxation', 'Auditing'], challenges=['Busy tax seasons'], dayInLife='Reviewing financial statements.'),
    CareerMatch(id='investmentbanker', title='Investment Banker', emoji='💰', matchPercent=80, field='finance', whyItFits='Thrive under pressure, love dealmaking.', skills=['Financial Modeling', 'Valuation'], challenges=['80-100 hrs/week'], dayInLife='Updating financial models.'),
    CareerMatch(id='cfo', title='Chief Financial Officer (CFO)', emoji='🏢', matchPercent=90, field='finance', whyItFits='You lead financial strategy for entire corporations.', skills=['Capital Allocation', 'Risk Management', 'Board Reporting'], challenges=['Market volatility'], dayInLife='Presenting quarterly earnings to the board.', isAdvanced=True),
]


@router.post("/profile", response_model=ProfileResponse)
async def analyze_profile(req: ProfileRequest):
    """
    Accepts user profiling answers and returns top 3 career matches.
    Currently returns mock data — swap in OpenAI call here.
    """
    # TODO: Send req.answers to OpenAI for intelligent matching
    return ProfileResponse(matches=MOCK_MATCHES)
