from fastapi import APIRouter
from database.agent_storage import agent_db
from pydantic import BaseModel
from typing import List, Optional, Dict

router = APIRouter()

class MarkReadRequest(BaseModel):
    message_ids: List[str]

class ObserverConfigRequest(BaseModel):
    keys: Dict[str, str]   # {"claude": "sk-ant-...", "openai": "sk-...", "gemini": "..."}
    models: Dict[str, str] # {"claude": "claude-3-5-sonnet...", ...}

@router.get("/messages")
async def get_agent_messages():
    """Fetch all unread messages from background agents"""
    messages = agent_db.get_unread_messages()
    return {"success": True, "messages": messages}

@router.post("/messages/mark-read")
async def mark_messages_read(request: MarkReadRequest):
    """Mark specific agent messages as read"""
    agent_db.mark_messages_read(request.message_ids)
    return {"success": True}

@router.get("/")
async def get_all_agents():
    """Get list of all agents"""
    agents = agent_db.get_all_agents()
    
    # Check master status
    from agent.scheduler import agent_scheduler
    is_master_paused = agent_scheduler.is_paused()
    
    return {
        "success": True, 
        "agents": agents,
        "master_paused": is_master_paused
    }

@router.post("/toggle-master")
async def toggle_master(request: dict):
    from agent.scheduler import agent_scheduler
    active = request.get('active', True)
    if active:
        agent_scheduler.resume_all()
    else:
        agent_scheduler.pause_all()
    return {"success": True, "master_paused": not active}

@router.post("/{agent_id}/toggle")
async def toggle_agent(agent_id: str, request: dict):
    from agent.scheduler import agent_scheduler
    active = request.get('active', True)
    agent_db.toggle_agent(agent_id, active)
    
    if active:
        agent = agent_db.get_agent(agent_id)
        if agent:
            # Re-add job (it uses replace_existing=True)
            schedule = agent.get('schedule', '')
            if ':' in schedule:
                schedule_type, schedule_val = schedule.split(':', 1)
                agent_scheduler.add_agent_job(agent_id, schedule_val, schedule_type=schedule_type)
            else:
                agent_scheduler.add_agent_job(agent_id, schedule)
    else:
        agent_scheduler.remove_agent_job(agent_id)
        
    return {"success": True}

@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    from agent.scheduler import agent_scheduler
    agent_scheduler.remove_agent_job(agent_id)
    agent_db.delete_agent(agent_id)
    return {"success": True}

@router.get("/{agent_id}/runs")
async def get_agent_runs(agent_id: str, limit: int = 10):
    """Get recent execution history for a specific agent"""
    runs = agent_db.get_agent_runs(agent_id, limit=limit)
    return {"success": True, "runs": runs}

@router.post("/observer-config")
async def save_observer_config(request: ObserverConfigRequest):
    """Save AI provider keys for use by the background observer"""
    from database.storage import get_storage
    storage = get_storage()
    import json
    storage.set_setting('observer_keys', json.dumps(request.keys))
    storage.set_setting('observer_models', json.dumps(request.models))
    return {"success": True}

@router.get("/observer-config")
async def get_observer_config():
    """Get observer AI config status (no keys exposed)"""
    from database.storage import get_storage
    import json
    storage = get_storage()
    raw = storage.get_setting('observer_keys') or '{}'
    keys = json.loads(raw)
    configured_providers = [p for p, k in keys.items() if k]
    return {"success": True, "configured_providers": configured_providers}
