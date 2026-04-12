"""
Simulation endpoint – returns a detailed "day in the life" for a given career.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SimulationRequest(BaseModel):
    career_id: str


class TimelineEvent(BaseModel):
    time: str
    activity: str
    icon: str


class SimulationResponse(BaseModel):
    career_id: str
    title: str
    timeline: list[TimelineEvent]


MOCK_TIMELINES: dict[str, list[TimelineEvent]] = {
    "swe": [
        TimelineEvent(time="9:00 AM", activity="Stand-up meeting with the team to discuss sprint progress", icon="coffee"),
        TimelineEvent(time="10:00 AM", activity="Deep work: building a new user authentication microservice", icon="laptop"),
        TimelineEvent(time="12:30 PM", activity="Lunch & a quick tech talk on Kubernetes", icon="coffee"),
        TimelineEvent(time="1:30 PM", activity="Code review for a teammate's pull request", icon="book"),
        TimelineEvent(time="3:00 PM", activity="Pair programming to fix a tricky caching bug", icon="users"),
        TimelineEvent(time="5:00 PM", activity="Write unit tests, push code, update JIRA tickets", icon="check"),
        TimelineEvent(time="5:30 PM", activity="Wrap up and plan tomorrow's priorities", icon="check"),
    ],
    "datascience": [
        TimelineEvent(time="9:00 AM", activity="Review overnight model training results", icon="coffee"),
        TimelineEvent(time="10:00 AM", activity="Exploratory data analysis on new customer dataset", icon="laptop"),
        TimelineEvent(time="11:30 AM", activity="Meeting with product team to define success metrics", icon="users"),
        TimelineEvent(time="1:00 PM", activity="Feature engineering and training an XGBoost model", icon="laptop"),
        TimelineEvent(time="3:00 PM", activity="Build a dashboard to visualize churn predictions", icon="laptop"),
        TimelineEvent(time="4:30 PM", activity="Document findings and prepare a team presentation", icon="book"),
        TimelineEvent(time="5:30 PM", activity="Read a research paper on transformer architectures", icon="book"),
    ],
    "uxdesign": [
        TimelineEvent(time="9:00 AM", activity="Review user interview transcripts from yesterday", icon="book"),
        TimelineEvent(time="10:00 AM", activity="Create low-fidelity wireframes for a new onboarding flow", icon="laptop"),
        TimelineEvent(time="11:30 AM", activity="Usability testing session with 3 participants", icon="users"),
        TimelineEvent(time="1:00 PM", activity="Synthesize findings and update the user journey map", icon="laptop"),
        TimelineEvent(time="2:30 PM", activity="Design high-fidelity mockups in Figma", icon="laptop"),
        TimelineEvent(time="4:00 PM", activity="Collaborate with engineers on interaction specs", icon="users"),
        TimelineEvent(time="5:00 PM", activity="Update the design system and component library", icon="check"),
    ],
}


@router.post("/simulation", response_model=SimulationResponse)
async def simulate_career(req: SimulationRequest):
    """
    Returns a simulated day-in-the-life timeline for the given career.
    """
    career_titles = {"swe": "Software Engineer", "datascience": "Data Scientist", "uxdesign": "UX Designer"}
    timeline = MOCK_TIMELINES.get(req.career_id, MOCK_TIMELINES["swe"])
    title = career_titles.get(req.career_id, "Software Engineer")
    return SimulationResponse(career_id=req.career_id, title=title, timeline=timeline)
