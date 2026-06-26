# Author: Mohibul Hoque
# Email: hokworks@gmail.com
# LinkedIn: linkedin.com/in/speedymohibul
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import asyncio
from typing import Optional, Dict, Any
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# Import the coordinator agent
from app.engine import pulseos_coordinator
from app.schema import PatientDigitalTwin, HealthRecord, LabResult

# Initialize global session service and runner
session_service = InMemorySessionService()
runner = Runner(
    agent=pulseos_coordinator,
    app_name="app",
    session_service=session_service
)

async def init_patient_session(session_id: str, age: int) -> PatientDigitalTwin:
    """
    Initialize a new patient session and store a clean PatientDigitalTwin model in the session state.
    """
    print(f"DEBUG: init_patient_session using session_service ID: {id(session_service)}")
    # Create the session
    await session_service.create_session(
        app_name="app",
        user_id="patient_user",
        session_id=session_id
    )
    
    # Instantiate the digital twin
    digital_twin = PatientDigitalTwin(age=age, history=[])
    
    # Store it in session state directly on storage session to persist it
    if hasattr(session_service, "sessions"):
        session_service.sessions["app"]["patient_user"][session_id].state["digital_twin"] = digital_twin.model_dump()
    else:
        session = await session_service.get_session(
            app_name="app",
            user_id="patient_user",
            session_id=session_id
        )
        if session:
            session.state["digital_twin"] = digital_twin.model_dump()
    
    return digital_twin

async def get_patient_digital_twin(session_id: str) -> Optional[PatientDigitalTwin]:
    """
    Retrieve the current PatientDigitalTwin model from the session's state.
    """
    try:
        session = await session_service.get_session(
            app_name="app",
            user_id="patient_user",
            session_id=session_id
        )
        if session:
            data = session.state.get("digital_twin")
            if data:
                return PatientDigitalTwin(**data)
    except Exception as e:
        print(f"DEBUG get_patient_digital_twin error: {e}")
        import traceback
        traceback.print_exc()
    return None

async def update_patient_digital_twin(session_id: str, digital_twin: PatientDigitalTwin):
    """
    Update the PatientDigitalTwin model stored in the session's state.
    """
    print(f"DEBUG: update_patient_digital_twin using session_service ID: {id(session_service)}")
    if hasattr(session_service, "sessions"):
        if "app" not in session_service.sessions:
            session_service.sessions["app"] = {}
        if "patient_user" not in session_service.sessions["app"]:
            session_service.sessions["app"]["patient_user"] = {}
        if session_id not in session_service.sessions["app"]["patient_user"]:
            await session_service.create_session(app_name="app", user_id="patient_user", session_id=session_id)
        session_service.sessions["app"]["patient_user"][session_id].state["digital_twin"] = digital_twin.model_dump()
    else:
        session = await session_service.get_session(
            app_name="app",
            user_id="patient_user",
            session_id=session_id
        )
        if session:
            session.state["digital_twin"] = digital_twin.model_dump()

async def send_message_to_agents(session_id: str, message: str) -> str:
    """
    Send a message to the coordinator agent and return the final text response.
    """
    response_text = ""
    
    # Create the content payload
    new_msg = types.Content(
        role="user",
        parts=[types.Part.from_text(text=message)]
    )
    
    # Run the coordinator agent asynchronously
    async for event in runner.run_async(
        user_id="patient_user",
        session_id=session_id,
        new_message=new_msg
    ):
        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    response_text += part.text
                    
    return response_text.strip()

# --- Console Verification Block ---
async def test_main():
    print("Testing main.py multi-agent runner initialization...")
    session_id = "test-session-123"
    
    # Initialize session
    print("1. Initializing patient session (Age: 35)...")
    twin = await init_patient_session(session_id, 35)
    print(f"   Patient ID: {twin.patient_id}, Age: {twin.age}")
    
    # Test message
    print("\n2. Sending test message to coordinator...")
    # NOTE: In standard local testing, if GCP credentials or keys are missing/incorrect,
    # the LLM call may fail. We run this inside try-except.
    try:
        response = await send_message_to_agents(
            session_id,
            "Hello, who are the specialized agents in PulseOS?"
        )
        print(f"Agent Response:\n{response}")
    except Exception as e:
        print(f"LLM Call skipped or failed (likely due to credentials): {e}")

if __name__ == "__main__":
    # To run test: python app/main.py
    try:
        asyncio.run(test_main())
    except KeyboardInterrupt:
        pass
