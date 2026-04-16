"""Automations engine for ProTerra CRM.

Owners can create automations via the AI assistant or manually.
Each automation has a trigger, optional conditions, and one or more actions.
The execution engine evaluates automations when relevant events occur.
"""
import os
import json
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/automations", tags=["Automations"])

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# ── Pydantic Schemas ──────────────────────────────────────────────────

class AutomationCreate(BaseModel):
    name: str
    description: str = ""
    trigger_type: str  # lead_created, lead_status_changed, project_status_changed, bid_submitted, bid_awarded, scheduled, webhook_received
    trigger_config: dict = {}  # e.g. {"from_status": "New Lead", "to_status": "Contacted"}
    conditions: list = []  # e.g. [{"field": "project_type", "operator": "equals", "value": "Pool"}]
    actions: list = []  # e.g. [{"type": "update_field", "entity": "lead", "field": "status", "value": "Contacted"}]
    enabled: bool = True


class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_config: Optional[dict] = None
    conditions: Optional[list] = None
    actions: Optional[list] = None
    enabled: Optional[bool] = None


class AIAutomationRequest(BaseModel):
    prompt: str  # Natural language description of the automation


# ── CRUD Endpoints ────────────────────────────────────────────────────

@router.get("")
def list_automations(db: Session = Depends(get_db)):
    """List all automations."""
    autos = db.query(models.Automation).order_by(models.Automation.created_at.desc()).all()
    return [_serialize_automation(a) for a in autos]


@router.get("/{automation_id}")
def get_automation(automation_id: str, db: Session = Depends(get_db)):
    """Get a single automation."""
    auto = db.query(models.Automation).filter(models.Automation.automation_id == automation_id).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
    return _serialize_automation(auto)


@router.post("")
def create_automation(data: AutomationCreate, db: Session = Depends(get_db)):
    """Create a new automation."""
    auto = models.Automation(
        name=data.name,
        description=data.description,
        trigger_type=data.trigger_type,
        trigger_config=json.dumps(data.trigger_config),
        conditions=json.dumps(data.conditions),
        actions=json.dumps(data.actions),
        enabled=data.enabled,
    )
    db.add(auto)
    db.commit()
    db.refresh(auto)

    # Log it
    _log_activity(db, "automation", auto.automation_id, "created", f"Automation '{auto.name}' created")
    return _serialize_automation(auto)


@router.put("/{automation_id}")
def update_automation(automation_id: str, data: AutomationUpdate, db: Session = Depends(get_db)):
    """Update an automation."""
    auto = db.query(models.Automation).filter(models.Automation.automation_id == automation_id).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")

    if data.name is not None:
        auto.name = data.name
    if data.description is not None:
        auto.description = data.description
    if data.trigger_type is not None:
        auto.trigger_type = data.trigger_type
    if data.trigger_config is not None:
        auto.trigger_config = json.dumps(data.trigger_config)
    if data.conditions is not None:
        auto.conditions = json.dumps(data.conditions)
    if data.actions is not None:
        auto.actions = json.dumps(data.actions)
    if data.enabled is not None:
        auto.enabled = data.enabled

    auto.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(auto)
    return _serialize_automation(auto)


@router.delete("/{automation_id}")
def delete_automation(automation_id: str, db: Session = Depends(get_db)):
    """Delete an automation."""
    auto = db.query(models.Automation).filter(models.Automation.automation_id == automation_id).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")

    # Also delete execution logs
    db.query(models.AutomationLog).filter(models.AutomationLog.automation_id == automation_id).delete()
    db.delete(auto)
    db.commit()
    return {"status": "deleted"}


@router.post("/{automation_id}/toggle")
def toggle_automation(automation_id: str, db: Session = Depends(get_db)):
    """Enable or disable an automation."""
    auto = db.query(models.Automation).filter(models.Automation.automation_id == automation_id).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
    auto.enabled = not auto.enabled
    auto.updated_at = datetime.utcnow()
    db.commit()
    return {"automation_id": automation_id, "enabled": auto.enabled}


@router.get("/{automation_id}/logs")
def get_automation_logs(automation_id: str, db: Session = Depends(get_db)):
    """Get execution logs for an automation."""
    logs = db.query(models.AutomationLog).filter(
        models.AutomationLog.automation_id == automation_id
    ).order_by(models.AutomationLog.executed_at.desc()).limit(50).all()
    return [{
        "log_id": l.log_id,
        "automation_id": l.automation_id,
        "trigger_event": l.trigger_event,
        "entity_type": l.entity_type,
        "entity_id": l.entity_id,
        "actions_taken": json.loads(l.actions_taken) if l.actions_taken else [],
        "success": l.success,
        "error_message": l.error_message,
        "executed_at": l.executed_at.isoformat() if l.executed_at else None,
    } for l in logs]


# ── AI-Powered Automation Creation ────────────────────────────────────

@router.post("/ai/create")
def ai_create_automation(data: AIAutomationRequest, db: Session = Depends(get_db)):
    """Use AI to create an automation from a natural language description."""
    if not OPENAI_API_KEY:
        return _fallback_ai_create(data.prompt, db)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        # Build context about what's available
        system_prompt = _build_ai_automation_prompt(db)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": data.prompt},
            ],
            max_tokens=1500,
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)

        # Validate required fields
        if not result.get("name") or not result.get("trigger_type"):
            return {
                "status": "clarification_needed",
                "message": result.get("message", "I need more details to create this automation. Could you specify what should trigger it and what action should be taken?"),
                "suggestion": result,
            }

        # Create the automation
        auto = models.Automation(
            name=result["name"],
            description=result.get("description", ""),
            trigger_type=result["trigger_type"],
            trigger_config=json.dumps(result.get("trigger_config", {})),
            conditions=json.dumps(result.get("conditions", [])),
            actions=json.dumps(result.get("actions", [])),
            enabled=True,
        )
        db.add(auto)
        db.commit()
        db.refresh(auto)

        _log_activity(db, "automation", auto.automation_id, "created", f"AI created automation '{auto.name}'")

        return {
            "status": "created",
            "message": f"I've created the automation '{auto.name}'. {result.get('explanation', '')}",
            "automation": _serialize_automation(auto),
        }

    except Exception as e:
        return _fallback_ai_create(data.prompt, db)


@router.get("/ai/suggestions")
def get_automation_suggestions(db: Session = Depends(get_db)):
    """Get AI-suggested automations based on current CRM state."""
    suggestions = []

    # Check for patterns that could benefit from automation
    new_leads = db.query(models.Lead).filter(models.Lead.status == "New Lead").count()
    if new_leads > 3:
        suggestions.append({
            "prompt": "Automatically move new leads to 'Contacted' status after I log a note",
            "description": "Auto-advance leads after contact is made",
            "category": "lead_management",
        })

    total_leads = db.query(models.Lead).count()
    if total_leads > 5:
        suggestions.append({
            "prompt": "Send me a daily summary of my lead pipeline and any stale leads older than 7 days",
            "description": "Daily lead pipeline digest",
            "category": "reporting",
        })

    active_projects = db.query(models.Project).filter(
        models.Project.status.notin_(["Complete", "Cancelled"])
    ).count()
    if active_projects > 0:
        suggestions.append({
            "prompt": "Notify me when a project has been in the same status for more than 2 weeks",
            "description": "Stalled project alerts",
            "category": "project_tracking",
        })

    open_packages = db.query(models.BidPackage).filter(models.BidPackage.status == "Open").count()
    if open_packages > 0:
        suggestions.append({
            "prompt": "Alert me when all contractors have submitted bids for a package so I can start comparing",
            "description": "Bid completion notifications",
            "category": "bidding",
        })

    contractors = db.query(models.Contractor).filter(models.Contractor.active == True).count()
    if contractors > 3:
        suggestions.append({
            "prompt": "When a new bid package is created, automatically invite contractors whose specialty matches the project type",
            "description": "Auto-invite matching contractors to bid",
            "category": "bidding",
        })

    # Always suggest these
    suggestions.append({
        "prompt": "When a lead is converted to a project, automatically create the standard task checklist",
        "description": "Auto-create project tasks on conversion",
        "category": "project_setup",
    })

    suggestions.append({
        "prompt": "When a bid is awarded, change the project status to 'Builder Selected' and log the activity",
        "description": "Auto-update project on bid award",
        "category": "bidding",
    })

    return {"suggestions": suggestions}


# ── Execution Engine ──────────────────────────────────────────────────

def execute_automations(db: Session, trigger_type: str, entity_type: str, entity_id: str, event_data: dict):
    """Execute all matching automations for a given trigger event.

    Called from other route handlers when events occur.
    """
    automations = db.query(models.Automation).filter(
        models.Automation.trigger_type == trigger_type,
        models.Automation.enabled == True,
    ).all()

    results = []
    for auto in automations:
        trigger_config = json.loads(auto.trigger_config) if auto.trigger_config else {}
        conditions = json.loads(auto.conditions) if auto.conditions else []
        actions = json.loads(auto.actions) if auto.actions else []

        # Check trigger config matches
        if not _matches_trigger(trigger_config, event_data):
            continue

        # Check conditions
        if not _evaluate_conditions(conditions, event_data, db):
            continue

        # Execute actions
        actions_taken = []
        success = True
        error_message = ""

        for action in actions:
            try:
                result = _execute_action(action, entity_type, entity_id, event_data, db)
                actions_taken.append({"action": action, "result": result})
            except Exception as e:
                success = False
                error_message = str(e)
                actions_taken.append({"action": action, "error": str(e)})

        # Log execution
        log = models.AutomationLog(
            automation_id=auto.automation_id,
            trigger_event=trigger_type,
            entity_type=entity_type,
            entity_id=entity_id,
            actions_taken=json.dumps(actions_taken),
            success=success,
            error_message=error_message,
        )
        db.add(log)

        # Update run count and last_run
        auto.run_count = (auto.run_count or 0) + 1
        auto.last_run_at = datetime.utcnow()
        db.commit()

        results.append({
            "automation": auto.name,
            "success": success,
            "actions_taken": actions_taken,
        })

    return results


def _matches_trigger(trigger_config: dict, event_data: dict) -> bool:
    """Check if trigger config matches the event data."""
    if not trigger_config:
        return True  # No specific config = match any event of this type

    for key, expected_value in trigger_config.items():
        actual_value = event_data.get(key)
        if expected_value == "*":
            continue  # Wildcard
        if actual_value != expected_value:
            return False
    return True


def _evaluate_conditions(conditions: list, event_data: dict, db: Session) -> bool:
    """Evaluate all conditions. All must be true (AND logic)."""
    for cond in conditions:
        field = cond.get("field", "")
        operator = cond.get("operator", "equals")
        value = cond.get("value", "")
        actual = event_data.get(field, "")

        if operator == "equals" and str(actual) != str(value):
            return False
        elif operator == "not_equals" and str(actual) == str(value):
            return False
        elif operator == "contains" and str(value).lower() not in str(actual).lower():
            return False
        elif operator == "greater_than":
            try:
                if float(actual) <= float(value):
                    return False
            except (ValueError, TypeError):
                return False
        elif operator == "less_than":
            try:
                if float(actual) >= float(value):
                    return False
            except (ValueError, TypeError):
                return False

    return True


def _execute_action(action: dict, entity_type: str, entity_id: str, event_data: dict, db: Session) -> str:
    """Execute a single automation action."""
    action_type = action.get("type", "")

    if action_type == "update_field":
        return _action_update_field(action, entity_type, entity_id, db)
    elif action_type == "create_activity":
        return _action_create_activity(action, entity_type, entity_id, db)
    elif action_type == "change_status":
        return _action_change_status(action, entity_type, entity_id, db)
    elif action_type == "create_task":
        return _action_create_task(action, event_data, db)
    elif action_type == "invite_contractors":
        return _action_invite_contractors(action, event_data, db)
    elif action_type == "log_notification":
        return _action_log_notification(action, entity_type, entity_id, event_data, db)
    else:
        return f"Unknown action type: {action_type}"


def _action_update_field(action: dict, entity_type: str, entity_id: str, db: Session) -> str:
    """Update a field on an entity."""
    entity = action.get("entity", entity_type)
    field = action.get("field", "")
    value = action.get("value", "")

    model_map = {
        "lead": (models.Lead, "lead_id"),
        "project": (models.Project, "project_id"),
        "contractor": (models.Contractor, "contractor_id"),
    }

    if entity not in model_map:
        return f"Unknown entity type: {entity}"

    model_cls, id_field = model_map[entity]
    record = db.query(model_cls).filter(getattr(model_cls, id_field) == entity_id).first()
    if not record:
        return f"{entity} {entity_id} not found"

    if hasattr(record, field):
        setattr(record, field, value)
        db.commit()
        return f"Updated {entity}.{field} to '{value}'"
    return f"Field '{field}' not found on {entity}"


def _action_change_status(action: dict, entity_type: str, entity_id: str, db: Session) -> str:
    """Change the status of an entity."""
    new_status = action.get("value", action.get("to_status", ""))
    entity = action.get("entity", entity_type)

    model_map = {
        "lead": (models.Lead, "lead_id"),
        "project": (models.Project, "project_id"),
        "bid": (models.Bid, "bid_id"),
        "bid_package": (models.BidPackage, "package_id"),
    }

    if entity not in model_map:
        return f"Unknown entity: {entity}"

    model_cls, id_field = model_map[entity]
    record = db.query(model_cls).filter(getattr(model_cls, id_field) == entity_id).first()
    if not record:
        return f"{entity} {entity_id} not found"

    old_status = record.status
    record.status = new_status
    db.commit()

    _log_activity(db, entity, entity_id, "status_changed",
                  f"Auto: {old_status} → {new_status}")
    return f"Changed {entity} status from '{old_status}' to '{new_status}'"


def _action_create_activity(action: dict, entity_type: str, entity_id: str, db: Session) -> str:
    """Create an activity log entry."""
    details = action.get("message", action.get("details", "Automation triggered"))
    _log_activity(db, entity_type, entity_id, "automation", details)
    return f"Logged activity: {details}"


def _action_create_task(action: dict, event_data: dict, db: Session) -> str:
    """Create a task on a project."""
    project_id = event_data.get("project_id", action.get("project_id", ""))
    if not project_id:
        return "No project_id available for task creation"

    task = models.Task(
        project_id=project_id,
        title=action.get("title", "Auto-created task"),
        description=action.get("description", ""),
        priority=action.get("priority", "medium"),
    )
    db.add(task)
    db.commit()
    return f"Created task: {task.title}"


def _action_invite_contractors(action: dict, event_data: dict, db: Session) -> str:
    """Auto-invite contractors whose specialty matches."""
    package_id = event_data.get("package_id", "")
    specialty = action.get("specialty", event_data.get("project_type", ""))

    if not package_id:
        return "No package_id available"

    contractors = db.query(models.Contractor).filter(
        models.Contractor.active == True,
        models.Contractor.specialty.ilike(f"%{specialty}%") if specialty else True,
    ).all()

    invited = 0
    for con in contractors:
        existing = db.query(models.Bid).filter(
            models.Bid.package_id == package_id,
            models.Bid.contractor_id == con.contractor_id,
        ).first()
        if not existing:
            bid = models.Bid(
                package_id=package_id,
                contractor_id=con.contractor_id,
                status="Invited",
            )
            db.add(bid)
            invited += 1

    db.commit()
    return f"Invited {invited} contractors to bid"


def _action_log_notification(action: dict, entity_type: str, entity_id: str, event_data: dict, db: Session) -> str:
    """Log a notification-style activity entry."""
    message = action.get("message", "Automation notification")
    # Template substitution for common fields
    for key, val in event_data.items():
        message = message.replace(f"{{{key}}}", str(val))

    _log_activity(db, entity_type, entity_id, "notification", message)
    return f"Notification: {message}"


# ── Helper Functions ──────────────────────────────────────────────────

def _serialize_automation(auto: models.Automation) -> dict:
    """Serialize an automation to a dict."""
    return {
        "automation_id": auto.automation_id,
        "name": auto.name,
        "description": auto.description,
        "trigger_type": auto.trigger_type,
        "trigger_config": json.loads(auto.trigger_config) if auto.trigger_config else {},
        "conditions": json.loads(auto.conditions) if auto.conditions else [],
        "actions": json.loads(auto.actions) if auto.actions else [],
        "enabled": auto.enabled,
        "run_count": auto.run_count or 0,
        "last_run_at": auto.last_run_at.isoformat() if auto.last_run_at else None,
        "created_at": auto.created_at.isoformat() if auto.created_at else None,
        "updated_at": auto.updated_at.isoformat() if auto.updated_at else None,
    }


def _log_activity(db: Session, entity_type: str, entity_id: str, action: str, details: str):
    """Helper to create activity log entries."""
    log = models.ActivityLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        details=details,
    )
    db.add(log)
    db.commit()


def _build_ai_automation_prompt(db: Session) -> str:
    """Build the system prompt for AI automation creation."""
    # Gather context about existing data
    lead_statuses = ["New Lead", "Contacted", "Site Visit Scheduled", "Qualified", "Proposal Sent", "Signed", "Lost"]
    project_statuses = ["Survey Scheduled", "Survey Complete", "Design In Progress", "Client Review",
                        "Revisions", "Design Approved", "Bidding Phase", "Builder Selected", "Construction", "Complete"]
    bid_statuses = ["Invited", "Viewed", "Submitted", "Under Review", "Awarded", "Declined"]

    contractors = db.query(models.Contractor).filter(models.Contractor.active == True).all()
    specialties = list(set(c.specialty for c in contractors if c.specialty))

    return f"""You are an automation builder for ProTerra Outdoor Design CRM.

Your job is to convert natural language automation requests into structured automation configs.

AVAILABLE TRIGGERS:
- lead_created: When a new lead is added
- lead_status_changed: When a lead's status changes (trigger_config can have "from_status" and "to_status")
- project_status_changed: When a project's status changes (trigger_config can have "from_status" and "to_status")
- bid_submitted: When a contractor submits a bid
- bid_awarded: When a bid is awarded
- bid_package_created: When a new bid package is created
- webhook_received: When a lead form submission comes in

LEAD STATUSES: {json.dumps(lead_statuses)}
PROJECT STATUSES: {json.dumps(project_statuses)}
BID STATUSES: {json.dumps(bid_statuses)}
CONTRACTOR SPECIALTIES: {json.dumps(specialties)}

AVAILABLE ACTIONS (each action is an object with a "type" field):
- update_field: Update a field on an entity. Fields: entity, field, value
- change_status: Change status. Fields: entity, value (new status)
- create_activity: Log an activity. Fields: message
- create_task: Create a project task. Fields: title, description, priority
- invite_contractors: Auto-invite contractors. Fields: specialty (to filter by)
- log_notification: Log a notification. Fields: message (can use {{field_name}} templates)

CONDITIONS (optional, AND logic):
Each condition: {{"field": "...", "operator": "equals|not_equals|contains|greater_than|less_than", "value": "..."}}

RESPOND WITH A JSON OBJECT containing:
- name: Short descriptive name for the automation
- description: One-line description
- trigger_type: One of the trigger types above
- trigger_config: Object with trigger-specific config (or empty object)
- conditions: Array of condition objects (or empty array)
- actions: Array of action objects
- explanation: Brief explanation of what this automation does (for the user)

If the request is unclear or you need more information, respond with:
- name: null
- message: "Your clarification question here"

Example output:
{{
  "name": "Auto-advance contacted leads",
  "description": "Move leads to Contacted when a note is logged",
  "trigger_type": "lead_status_changed",
  "trigger_config": {{"to_status": "Contacted"}},
  "conditions": [],
  "actions": [
    {{"type": "create_activity", "message": "Lead automatically advanced to Contacted"}},
    {{"type": "log_notification", "message": "Lead {{full_name}} has been contacted"}}
  ],
  "explanation": "This automation logs activity whenever a lead moves to Contacted status."
}}"""


def _fallback_ai_create(prompt: str, db: Session) -> dict:
    """Create automation without OpenAI - use pattern matching."""
    prompt_lower = prompt.lower()

    # Try to match common patterns
    if "new lead" in prompt_lower and ("contact" in prompt_lower or "follow" in prompt_lower):
        return {
            "status": "created",
            "message": "I've created an automation to log a follow-up reminder when new leads come in.",
            "automation": _create_simple_automation(db,
                name="New lead follow-up reminder",
                description="Log a follow-up reminder when a new lead is created",
                trigger_type="lead_created",
                actions=[
                    {"type": "log_notification", "message": "New lead {full_name} needs follow-up within 24 hours"},
                    {"type": "create_activity", "message": "Follow-up reminder: Contact new lead"},
                ],
            ),
        }

    if "bid" in prompt_lower and ("submit" in prompt_lower or "notify" in prompt_lower or "alert" in prompt_lower):
        return {
            "status": "created",
            "message": "I've created an automation to notify you when a bid is submitted.",
            "automation": _create_simple_automation(db,
                name="Bid submission alert",
                description="Log notification when a contractor submits a bid",
                trigger_type="bid_submitted",
                actions=[
                    {"type": "log_notification", "message": "A new bid has been submitted and needs review"},
                    {"type": "create_activity", "message": "Bid submitted - ready for review"},
                ],
            ),
        }

    if "project" in prompt_lower and ("status" in prompt_lower or "stalled" in prompt_lower or "stuck" in prompt_lower):
        return {
            "status": "created",
            "message": "I've created an automation to track project status changes.",
            "automation": _create_simple_automation(db,
                name="Project status change tracker",
                description="Log activity when project status changes",
                trigger_type="project_status_changed",
                actions=[
                    {"type": "create_activity", "message": "Project status has changed - review progress"},
                    {"type": "log_notification", "message": "Project {client_name} status updated"},
                ],
            ),
        }

    if ("award" in prompt_lower or "awarded" in prompt_lower) and "bid" in prompt_lower:
        return {
            "status": "created",
            "message": "I've created an automation to update the project when a bid is awarded.",
            "automation": _create_simple_automation(db,
                name="Bid awarded - update project",
                description="When a bid is awarded, update project to Builder Selected",
                trigger_type="bid_awarded",
                actions=[
                    {"type": "change_status", "entity": "project", "value": "Builder Selected"},
                    {"type": "log_notification", "message": "Bid awarded! Project moved to Builder Selected"},
                ],
            ),
        }

    if "contractor" in prompt_lower and ("invite" in prompt_lower or "auto" in prompt_lower):
        return {
            "status": "created",
            "message": "I've created an automation to auto-invite matching contractors when a bid package is created.",
            "automation": _create_simple_automation(db,
                name="Auto-invite contractors to bid",
                description="Automatically invite contractors whose specialty matches when a bid package is created",
                trigger_type="bid_package_created",
                actions=[
                    {"type": "invite_contractors", "specialty": ""},
                    {"type": "log_notification", "message": "Contractors auto-invited to new bid package"},
                ],
            ),
        }

    if "convert" in prompt_lower and ("lead" in prompt_lower or "project" in prompt_lower):
        return {
            "status": "created",
            "message": "I've created an automation to set up tasks when a lead is converted to a project.",
            "automation": _create_simple_automation(db,
                name="Lead conversion setup",
                description="Auto-create initial tasks when a lead is converted to a project",
                trigger_type="lead_status_changed",
                trigger_config={"to_status": "Signed"},
                actions=[
                    {"type": "create_activity", "message": "Lead converted to project - initial setup started"},
                    {"type": "log_notification", "message": "Lead {full_name} signed! Project setup needed."},
                ],
            ),
        }

    # Generic fallback
    return {
        "status": "clarification_needed",
        "message": (
            "I'd love to help create that automation! Could you be more specific about:\n\n"
            "1. **What triggers it?** (e.g., new lead, status change, bid submitted)\n"
            "2. **What should happen?** (e.g., change status, send notification, create task)\n\n"
            "For example: 'When a new lead comes in from the website, log a follow-up reminder'"
        ),
    }


def _create_simple_automation(db: Session, name: str, description: str, trigger_type: str,
                               actions: list, trigger_config: dict = None, conditions: list = None) -> dict:
    """Helper to create a simple automation and return serialized."""
    auto = models.Automation(
        name=name,
        description=description,
        trigger_type=trigger_type,
        trigger_config=json.dumps(trigger_config or {}),
        conditions=json.dumps(conditions or []),
        actions=json.dumps(actions),
        enabled=True,
    )
    db.add(auto)
    db.commit()
    db.refresh(auto)

    _log_activity(db, "automation", auto.automation_id, "created", f"AI created automation '{name}'")
    return _serialize_automation(auto)
