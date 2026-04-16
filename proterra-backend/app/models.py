"""SQLAlchemy models for ProTerra CRM."""
import uuid
from datetime import date, datetime
from sqlalchemy import (
    Column, String, Text, Float, Boolean, Integer, Date, DateTime,
    ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from .database import Base


def gen_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:12]}"


# ── Leads ──────────────────────────────────────────────────────────────
class Lead(Base):
    __tablename__ = "leads"

    lead_id = Column(String, primary_key=True, default=lambda: gen_id("lead_"))
    full_name = Column(String, nullable=False)
    email = Column(String, default="")
    phone = Column(String, default="")
    property_address = Column(String, default="")
    city = Column(String, default="")
    state = Column(String, default="")
    zip_code = Column(String, default="")
    project_type = Column(String, default="")  # Pool, Outdoor Kitchen, Patio, Full Backyard, Other
    budget_range = Column(String, default="")
    timeline = Column(String, default="")
    source = Column(String, default="website")  # website, facebook, instagram, referral, phone
    status = Column(String, default="New Lead")  # New Lead, Contacted, Analysis Scheduled, Analysis Complete, Proposal Sent, Signed, Lost
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to project (once converted)
    project = relationship("Project", back_populates="lead", uselist=False)


# ── Projects ───────────────────────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"

    project_id = Column(String, primary_key=True, default=lambda: gen_id("proj_"))
    lead_id = Column(String, ForeignKey("leads.lead_id"), nullable=True)
    client_name = Column(String, nullable=False)
    client_email = Column(String, default="")
    client_phone = Column(String, default="")
    property_address = Column(String, default="")
    project_type = Column(String, default="")
    description = Column(Text, default="")
    status = Column(String, default="Survey Scheduled")
    # Statuses: Survey Scheduled, Survey Complete, Design In Progress, Client Review,
    #           Revisions, Design Approved, Bidding Phase, Builder Selected, Construction, Complete
    budget_estimate = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    start_date = Column(Date, nullable=True)
    target_completion = Column(Date, nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lead = relationship("Lead", back_populates="project")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    bid_packages = relationship("BidPackage", back_populates="project", cascade="all, delete-orphan")
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")


# ── Tasks ──────────────────────────────────────────────────────────────
class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(String, primary_key=True, default=lambda: gen_id("task_"))
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="pending")  # pending, in_progress, completed
    priority = Column(String, default="medium")  # low, medium, high
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")


# ── Project Files ──────────────────────────────────────────────────────
class ProjectFile(Base):
    __tablename__ = "project_files"

    file_id = Column(String, primary_key=True, default=lambda: gen_id("file_"))
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, default="")  # drone_photo, 3d_render, design_pdf, survey, other
    file_url = Column(String, default="")  # In MVP, store base64 or local path
    file_size = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="files")


# ── Contractors ────────────────────────────────────────────────────────
class Contractor(Base):
    __tablename__ = "contractors"

    contractor_id = Column(String, primary_key=True, default=lambda: gen_id("con_"))
    company_name = Column(String, nullable=False)
    contact_name = Column(String, default="")
    email = Column(String, default="")
    phone = Column(String, default="")
    specialty = Column(String, default="")  # Pool Builder, Hardscape, Landscaping, Electrical, Plumbing, General
    service_area = Column(String, default="")
    license_number = Column(String, default="")
    insurance_status = Column(String, default="Active")  # Active, Expired, Unknown
    insurance_expiry = Column(Date, nullable=True)
    rating = Column(Float, default=0.0)  # Internal rating 0-5
    notes = Column(Text, default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bids = relationship("Bid", back_populates="contractor")


# ── Bid Packages ───────────────────────────────────────────────────────
class BidPackage(Base):
    __tablename__ = "bid_packages"

    package_id = Column(String, primary_key=True, default=lambda: gen_id("bp_"))
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    title = Column(String, nullable=False)
    scope_of_work = Column(Text, default="")
    material_specs = Column(Text, default="")
    site_conditions = Column(Text, default="")
    timeline_requirements = Column(String, default="")
    deadline = Column(Date, nullable=True)
    status = Column(String, default="Draft")  # Draft, Open, Closed, Awarded
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="bid_packages")
    bids = relationship("Bid", back_populates="bid_package", cascade="all, delete-orphan")


# ── Bids ───────────────────────────────────────────────────────────────
class Bid(Base):
    __tablename__ = "bids"

    bid_id = Column(String, primary_key=True, default=lambda: gen_id("bid_"))
    package_id = Column(String, ForeignKey("bid_packages.package_id"), nullable=False)
    contractor_id = Column(String, ForeignKey("contractors.contractor_id"), nullable=False)
    total_price = Column(Float, default=0.0)
    materials_cost = Column(Float, default=0.0)
    labor_cost = Column(Float, default=0.0)
    equipment_cost = Column(Float, default=0.0)
    permit_cost = Column(Float, default=0.0)
    proposed_timeline = Column(String, default="")
    warranty_terms = Column(String, default="")
    notes = Column(Text, default="")
    status = Column(String, default="Invited")  # Invited, Viewed, Submitted, Under Review, Awarded, Declined
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bid_package = relationship("BidPackage", back_populates="bids")
    contractor = relationship("Contractor", back_populates="bids")


# ── Activity Log ───────────────────────────────────────────────────────
class ActivityLog(Base):
    __tablename__ = "activity_log"

    log_id = Column(String, primary_key=True, default=lambda: gen_id("log_"))
    entity_type = Column(String, nullable=False)  # lead, project, contractor, bid
    entity_id = Column(String, nullable=False)
    action = Column(String, nullable=False)  # created, updated, status_changed, etc.
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Automations ───────────────────────────────────────────────────────
class Automation(Base):
    __tablename__ = "automations"

    automation_id = Column(String, primary_key=True, default=lambda: gen_id("auto_"))
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    trigger_type = Column(String, nullable=False)
    # Triggers: lead_created, lead_status_changed, project_status_changed,
    #           bid_submitted, bid_awarded, bid_package_created, webhook_received
    trigger_config = Column(Text, default="{}")  # JSON: e.g. {"from_status": "New Lead", "to_status": "Contacted"}
    conditions = Column(Text, default="[]")  # JSON array of conditions
    actions = Column(Text, default="[]")  # JSON array of actions
    enabled = Column(Boolean, default=True)
    run_count = Column(Integer, default=0)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    logs = relationship("AutomationLog", back_populates="automation", cascade="all, delete-orphan")


class AutomationLog(Base):
    __tablename__ = "automation_logs"

    log_id = Column(String, primary_key=True, default=lambda: gen_id("alog_"))
    automation_id = Column(String, ForeignKey("automations.automation_id"), nullable=False)
    trigger_event = Column(String, default="")
    entity_type = Column(String, default="")
    entity_id = Column(String, default="")
    actions_taken = Column(Text, default="[]")  # JSON
    success = Column(Boolean, default=True)
    error_message = Column(Text, default="")
    executed_at = Column(DateTime, default=datetime.utcnow)

    automation = relationship("Automation", back_populates="logs")


# ── Client Portal ────────────────────────────────────────────────────
class ClientPortalAccess(Base):
    __tablename__ = "client_portal_access"

    access_id = Column(String, primary_key=True, default=lambda: gen_id("cpa_"))
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    access_token = Column(String, nullable=False, unique=True)
    client_name = Column(String, nullable=False)
    client_email = Column(String, default="")
    is_active = Column(Boolean, default=True)
    last_accessed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")


class DesignApproval(Base):
    __tablename__ = "design_approvals"

    approval_id = Column(String, primary_key=True, default=lambda: gen_id("appr_"))
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="Pending")  # Pending, Approved, Revision Requested
    client_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)

    project = relationship("Project")


# ── Invoicing & Payments ─────────────────────────────────────────────
class Invoice(Base):
    __tablename__ = "invoices"

    invoice_id = Column(String, primary_key=True, default=lambda: gen_id("inv_"))
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    invoice_number = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    amount = Column(Float, nullable=False, default=0.0)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    status = Column(String, default="Draft")  # Draft, Sent, Paid, Overdue, Cancelled
    due_date = Column(Date, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    stripe_payment_intent_id = Column(String, default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project")
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    item_id = Column(String, primary_key=True, default=lambda: gen_id("ili_"))
    invoice_id = Column(String, ForeignKey("invoices.invoice_id"), nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    sort_order = Column(Integer, default=0)

    invoice = relationship("Invoice", back_populates="line_items")


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(String, primary_key=True, default=lambda: gen_id("pay_"))
    invoice_id = Column(String, ForeignKey("invoices.invoice_id"), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    method = Column(String, default="")  # stripe, check, cash, bank_transfer
    stripe_payment_id = Column(String, default="")
    notes = Column(Text, default="")
    paid_at = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")


class PaymentSchedule(Base):
    __tablename__ = "payment_schedules"

    schedule_id = Column(String, primary_key=True, default=lambda: gen_id("ps_"))
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    milestone = Column(String, nullable=False)  # e.g. "Deposit", "Midpoint", "Completion"
    percentage = Column(Float, default=0.0)  # % of total
    amount = Column(Float, default=0.0)
    due_date = Column(Date, nullable=True)
    status = Column(String, default="Pending")  # Pending, Invoiced, Paid
    invoice_id = Column(String, ForeignKey("invoices.invoice_id"), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    invoice = relationship("Invoice")
