"""
Roadmap endpoint – generates a 7-day execution plan for the chosen career.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class RoadmapRequest(BaseModel):
    career_id: str


class Task(BaseModel):
    id: str
    text: str
    done: bool = False


class DayPlan(BaseModel):
    day: int
    title: str
    tasks: list[Task]


class RoadmapResponse(BaseModel):
    career_id: str
    days: list[DayPlan]


MOCK_ROADMAPS: dict[str, list[DayPlan]] = {
    "swe": [
        DayPlan(day=1, title="Foundations", tasks=[
            Task(id="1-1", text="Set up your development environment (VS Code, Git, Node.js)"),
            Task(id="1-2", text="Learn core programming concepts: variables, loops, functions"),
            Task(id="1-3", text="Complete a 'Hello World' project in JavaScript or Python"),
        ]),
        DayPlan(day=2, title="Data Structures Basics", tasks=[
            Task(id="2-1", text="Learn Arrays, Strings, and Hash Maps"),
            Task(id="2-2", text="Solve 3 easy problems on LeetCode"),
            Task(id="2-3", text="Write notes summarizing Big-O notation"),
        ]),
        DayPlan(day=3, title="Build a Mini Project", tasks=[
            Task(id="3-1", text="Create a simple To-Do app with HTML, CSS, JS"),
            Task(id="3-2", text="Add local storage for persistence"),
            Task(id="3-3", text="Push the project to GitHub"),
        ]),
        DayPlan(day=4, title="Backend Introduction", tasks=[
            Task(id="4-1", text="Learn what APIs are and how HTTP works"),
            Task(id="4-2", text="Build a simple REST API with Express or FastAPI"),
            Task(id="4-3", text="Test your API with Postman"),
        ]),
        DayPlan(day=5, title="Databases & Storage", tasks=[
            Task(id="5-1", text="Learn SQL basics: SELECT, INSERT, JOIN"),
            Task(id="5-2", text="Set up SQLite and connect it to your API"),
            Task(id="5-3", text="Build a CRUD endpoint connected to your database"),
        ]),
        DayPlan(day=6, title="Full-Stack Integration", tasks=[
            Task(id="6-1", text="Connect your To-Do frontend to your backend API"),
            Task(id="6-2", text="Handle loading states and error messages in UI"),
            Task(id="6-3", text="Add a README with setup instructions to your repo"),
        ]),
        DayPlan(day=7, title="Publish & Reflect", tasks=[
            Task(id="7-1", text="Deploy your app to Vercel or Netlify"),
            Task(id="7-2", text="Write a blog post or LinkedIn post about what you built"),
            Task(id="7-3", text="Plan your next learning goals for the coming month"),
        ]),
    ],
}


@router.post("/roadmap", response_model=RoadmapResponse)
async def generate_roadmap(req: RoadmapRequest):
    """
    Returns a 7-day personalized execution plan for the chosen career.
    """
    days = MOCK_ROADMAPS.get(req.career_id, MOCK_ROADMAPS["swe"])
    return RoadmapResponse(career_id=req.career_id, days=days)
