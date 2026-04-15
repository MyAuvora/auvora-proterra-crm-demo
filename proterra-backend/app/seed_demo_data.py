"""Seed realistic demo data for ProTerra Design CRM."""
from datetime import datetime, date, timedelta
from .database import SessionLocal
from . import models


def seed_demo_data():
    """Populate the database with realistic ProTerra Design demo data."""
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(models.Lead).count() > 0:
            print("Database already has data, skipping seed")
            return

        print("Seeding demo data for ProTerra Design CRM...")
        now = datetime.utcnow()

        # ── Leads ─────────────────────────────────────────────────────
        leads_data = [
            {
                "lead_id": "lead_001",
                "full_name": "Mark & Lisa Henderson",
                "email": "henderson.mark@gmail.com",
                "phone": "850-555-0142",
                "property_address": "4821 Soundside Dr",
                "city": "Gulf Breeze",
                "state": "FL",
                "zip_code": "32563",
                "project_type": "Full Backyard",
                "budget_range": "$150,000 - $200,000",
                "timeline": "6-9 months",
                "source": "referral",
                "status": "Signed",
                "notes": "Referred by the Wilsons. Want complete backyard transformation with pool, outdoor kitchen, and fire pit.",
                "created_at": now - timedelta(days=45),
            },
            {
                "lead_id": "lead_002",
                "full_name": "David Chen",
                "email": "david.chen@outlook.com",
                "phone": "251-555-0198",
                "property_address": "1290 Bay Front Ave",
                "city": "Daphne",
                "state": "AL",
                "zip_code": "36526",
                "project_type": "Pool",
                "budget_range": "$80,000 - $120,000",
                "timeline": "4-6 months",
                "source": "website",
                "status": "Signed",
                "notes": "Found us on Google. Wants infinity-edge pool with spa. Large lot with bay views.",
                "created_at": now - timedelta(days=38),
            },
            {
                "lead_id": "lead_003",
                "full_name": "Sarah & Tom Rodriguez",
                "email": "srodriguez@yahoo.com",
                "phone": "850-555-0267",
                "property_address": "7650 Navarre Pkwy",
                "city": "Navarre",
                "state": "FL",
                "zip_code": "32566",
                "project_type": "Outdoor Kitchen",
                "budget_range": "$40,000 - $60,000",
                "timeline": "3-4 months",
                "source": "facebook",
                "status": "Proposal Sent",
                "notes": "Saw our Facebook ad. Want a full outdoor kitchen with pizza oven and bar seating.",
                "created_at": now - timedelta(days=22),
            },
            {
                "lead_id": "lead_004",
                "full_name": "James Whitfield",
                "email": "jwhitfield@protonmail.com",
                "phone": "850-555-0334",
                "property_address": "3415 Scenic Hwy",
                "city": "Pensacola",
                "state": "FL",
                "zip_code": "32503",
                "project_type": "Patio/Deck",
                "budget_range": "$25,000 - $40,000",
                "timeline": "2-3 months",
                "source": "instagram",
                "status": "Site Visit Scheduled",
                "notes": "DM'd us on Instagram. Wants a travertine patio with pergola and string lights.",
                "created_at": now - timedelta(days=14),
            },
            {
                "lead_id": "lead_005",
                "full_name": "Angela & Robert Foster",
                "email": "angela.foster@gmail.com",
                "phone": "251-555-0411",
                "property_address": "892 Old Shell Rd",
                "city": "Mobile",
                "state": "AL",
                "zip_code": "36608",
                "project_type": "Full Backyard",
                "budget_range": "$200,000 - $300,000",
                "timeline": "9-12 months",
                "source": "referral",
                "status": "Signed",
                "notes": "High-end project. Want pool, outdoor kitchen, fire feature, landscape lighting, and custom pergola.",
                "created_at": now - timedelta(days=60),
            },
            {
                "lead_id": "lead_006",
                "full_name": "Patricia Nguyen",
                "email": "pnguyen@gmail.com",
                "phone": "850-555-0523",
                "property_address": "5100 Tiger Point Blvd",
                "city": "Gulf Breeze",
                "state": "FL",
                "zip_code": "32563",
                "project_type": "Pool",
                "budget_range": "$60,000 - $85,000",
                "timeline": "4-6 months",
                "source": "google",
                "status": "Contacted",
                "notes": "Called in after Google search. Interested in a freeform pool with rock waterfall.",
                "created_at": now - timedelta(days=8),
            },
            {
                "lead_id": "lead_007",
                "full_name": "Mike & Jennifer Adams",
                "email": "adams.mike@icloud.com",
                "phone": "850-555-0645",
                "property_address": "2200 Fred Smith Rd",
                "city": "Pace",
                "state": "FL",
                "zip_code": "32571",
                "project_type": "Fire Feature",
                "budget_range": "$15,000 - $25,000",
                "timeline": "1-2 months",
                "source": "facebook",
                "status": "New Lead",
                "notes": "Want a custom fire pit area with seating wall. Submitted form from FB ad.",
                "created_at": now - timedelta(days=3),
            },
            {
                "lead_id": "lead_008",
                "full_name": "Karen Blackwell",
                "email": "kblackwell@bellsouth.net",
                "phone": "251-555-0778",
                "property_address": "4500 Whispering Pines Rd",
                "city": "Fairhope",
                "state": "AL",
                "zip_code": "36532",
                "project_type": "Landscaping",
                "budget_range": "$30,000 - $50,000",
                "timeline": "2-3 months",
                "source": "referral",
                "status": "Qualified",
                "notes": "Friend of the Fosters. Wants complete landscape redesign with native plantings and irrigation.",
                "created_at": now - timedelta(days=12),
            },
            {
                "lead_id": "lead_009",
                "full_name": "Chris & Emily Taylor",
                "email": "ctaylor@gmail.com",
                "phone": "850-555-0889",
                "property_address": "6780 Gulf Beach Hwy",
                "city": "Pensacola",
                "state": "FL",
                "zip_code": "32507",
                "project_type": "Pergola/Pavilion",
                "budget_range": "$20,000 - $35,000",
                "timeline": "2-3 months",
                "source": "website",
                "status": "Contacted",
                "notes": "Website inquiry. Want a cedar pergola with outdoor fan and TV for football Sundays.",
                "created_at": now - timedelta(days=6),
            },
            {
                "lead_id": "lead_010",
                "full_name": "William Dupree",
                "email": "wdupree@outlook.com",
                "phone": "850-555-0912",
                "property_address": "1100 Quietwater Beach Rd",
                "city": "Pensacola Beach",
                "state": "FL",
                "zip_code": "32561",
                "project_type": "Pool",
                "budget_range": "$100,000 - $150,000",
                "timeline": "6-8 months",
                "source": "instagram",
                "status": "New Lead",
                "notes": "Beach property. Wants a saltwater pool with swim-up bar. Saw drone footage on Instagram.",
                "created_at": now - timedelta(days=1),
            },
            {
                "lead_id": "lead_011",
                "full_name": "Diana & Frank Martinez",
                "email": "dianafrank@gmail.com",
                "phone": "251-555-1034",
                "property_address": "320 Magnolia Ave",
                "city": "Foley",
                "state": "AL",
                "zip_code": "36535",
                "project_type": "Outdoor Kitchen",
                "budget_range": "$35,000 - $55,000",
                "timeline": "3-4 months",
                "source": "google",
                "status": "New Lead",
                "notes": "Google search. Want outdoor kitchen with built-in grill, smoker, and bar.",
                "created_at": now - timedelta(days=2),
            },
            {
                "lead_id": "lead_012",
                "full_name": "Richard & Anne Collins",
                "email": "rcollins@gmail.com",
                "phone": "850-555-1156",
                "property_address": "8900 Escambia River Rd",
                "city": "Milton",
                "state": "FL",
                "zip_code": "32583",
                "project_type": "Full Backyard",
                "budget_range": "$120,000 - $180,000",
                "timeline": "6-9 months",
                "source": "referral",
                "status": "Signed",
                "notes": "5-acre property. Want pool, outdoor living area, sport court, and landscape lighting.",
                "created_at": now - timedelta(days=52),
            },
            {
                "lead_id": "lead_013",
                "full_name": "Stephanie Brooks",
                "email": "sbrooks@yahoo.com",
                "phone": "850-555-1278",
                "property_address": "2450 E Cervantes St",
                "city": "Pensacola",
                "state": "FL",
                "zip_code": "32503",
                "project_type": "Landscaping",
                "budget_range": "$18,000 - $30,000",
                "timeline": "1-2 months",
                "source": "website",
                "status": "Lost",
                "notes": "Went with a cheaper landscaping-only company. May circle back for hardscaping later.",
                "created_at": now - timedelta(days=30),
            },
        ]

        for ld in leads_data:
            db.add(models.Lead(**ld))

        # ── Contractors ───────────────────────────────────────────────
        contractors_data = [
            {
                "contractor_id": "con_001",
                "company_name": "Gulf Coast Pools & Spas",
                "contact_name": "Tommy Vickers",
                "email": "tommy@gulfcoastpools.com",
                "phone": "850-555-2001",
                "specialty": "Pool Construction",
                "service_area": "Pensacola, Gulf Breeze, Navarre",
                "license_number": "CPC-1458923",
                "insurance_status": "Active",
                "insurance_expiry": date(2026, 12, 31),
                "rating": 4.8,
                "notes": "Top-rated pool builder. 15+ years experience. Known for gunite pools.",
                "active": True,
            },
            {
                "contractor_id": "con_002",
                "company_name": "Emerald Coast Hardscapes",
                "contact_name": "Rick Sanchez",
                "email": "rick@emeraldhardscapes.com",
                "phone": "850-555-2002",
                "specialty": "Hardscaping",
                "service_area": "FL Panhandle, Coastal AL",
                "license_number": "CBC-0674521",
                "insurance_status": "Active",
                "insurance_expiry": date(2026, 9, 15),
                "rating": 4.5,
                "notes": "Specializes in travertine, pavers, and retaining walls. Reliable crew.",
                "active": True,
            },
            {
                "contractor_id": "con_003",
                "company_name": "Southern Outdoor Kitchens",
                "contact_name": "Dale Prescott",
                "email": "dale@southernoutdoor.com",
                "phone": "251-555-2003",
                "specialty": "Outdoor Kitchen",
                "service_area": "Mobile, Baldwin County, Pensacola",
                "license_number": "GC-8834567",
                "insurance_status": "Active",
                "insurance_expiry": date(2027, 3, 1),
                "rating": 4.7,
                "notes": "Custom outdoor kitchens and grilling stations. Works with all major brands.",
                "active": True,
            },
            {
                "contractor_id": "con_004",
                "company_name": "Panhandle Electric Co.",
                "contact_name": "Steve Monroe",
                "email": "steve@panhandleelectric.com",
                "phone": "850-555-2004",
                "specialty": "Electrical",
                "service_area": "Escambia & Santa Rosa Counties",
                "license_number": "EC-13009876",
                "insurance_status": "Active",
                "insurance_expiry": date(2026, 11, 30),
                "rating": 4.6,
                "notes": "Licensed master electrician. Does landscape lighting, pool electrical, and panel upgrades.",
                "active": True,
            },
            {
                "contractor_id": "con_005",
                "company_name": "AquaFlow Plumbing",
                "contact_name": "Bobby Tran",
                "email": "bobby@aquaflowplumbing.com",
                "phone": "850-555-2005",
                "specialty": "Plumbing",
                "service_area": "NW Florida",
                "license_number": "CFC-1557890",
                "insurance_status": "Active",
                "insurance_expiry": date(2026, 8, 15),
                "rating": 4.3,
                "notes": "Pool plumbing, gas lines for outdoor kitchens, irrigation tie-ins.",
                "active": True,
            },
            {
                "contractor_id": "con_006",
                "company_name": "Bayshore Landscaping",
                "contact_name": "Maria Gonzalez",
                "email": "maria@bayshorelandscape.com",
                "phone": "251-555-2006",
                "specialty": "Landscaping",
                "service_area": "Baldwin County AL, Escambia County FL",
                "license_number": "LC-4423189",
                "insurance_status": "Active",
                "insurance_expiry": date(2027, 1, 15),
                "rating": 4.9,
                "notes": "Award-winning landscape design. Native plantings specialist. Excellent attention to detail.",
                "active": True,
            },
            {
                "contractor_id": "con_007",
                "company_name": "Coastal Concrete & Masonry",
                "contact_name": "Doug Harris",
                "email": "doug@coastalconcrete.com",
                "phone": "850-555-2007",
                "specialty": "Concrete/Masonry",
                "service_area": "Pensacola metro area",
                "license_number": "CGC-0612345",
                "insurance_status": "Active",
                "insurance_expiry": date(2026, 10, 1),
                "rating": 4.4,
                "notes": "Stamped concrete, block walls, fire pits, and custom masonry work.",
                "active": True,
            },
            {
                "contractor_id": "con_008",
                "company_name": "SunBright Irrigation",
                "contact_name": "Kyle Patterson",
                "email": "kyle@sunbright.com",
                "phone": "850-555-2008",
                "specialty": "Irrigation",
                "service_area": "FL Panhandle",
                "license_number": "IR-7789012",
                "insurance_status": "Active",
                "insurance_expiry": date(2026, 7, 31),
                "rating": 4.2,
                "notes": "Smart irrigation systems. Rain Bird and Hunter certified installer.",
                "active": True,
            },
            {
                "contractor_id": "con_009",
                "company_name": "Pensacola Fence & Rail",
                "contact_name": "Luke Jennings",
                "email": "luke@pensacolafence.com",
                "phone": "850-555-2009",
                "specialty": "Fencing",
                "service_area": "Escambia & Santa Rosa Counties",
                "license_number": "GC-9901234",
                "insurance_status": "Active",
                "insurance_expiry": date(2027, 2, 28),
                "rating": 4.1,
                "notes": "Aluminum pool fencing, privacy fences, custom gates. Quick turnaround.",
                "active": True,
            },
            {
                "contractor_id": "con_010",
                "company_name": "LightScape Outdoor",
                "contact_name": "Amy Crawford",
                "email": "amy@lightscapeoutdoor.com",
                "phone": "251-555-2010",
                "specialty": "Lighting",
                "service_area": "Gulf Coast FL & AL",
                "license_number": "EC-13054321",
                "insurance_status": "Active",
                "insurance_expiry": date(2026, 12, 15),
                "rating": 4.7,
                "notes": "Low-voltage landscape lighting design and installation. LED specialist.",
                "active": True,
            },
        ]

        for cd in contractors_data:
            db.add(models.Contractor(**cd))

        # ── Projects (from signed leads) ──────────────────────────────
        projects_data = [
            {
                "project_id": "proj_001",
                "lead_id": "lead_001",
                "client_name": "Mark & Lisa Henderson",
                "client_email": "henderson.mark@gmail.com",
                "client_phone": "850-555-0142",
                "property_address": "4821 Soundside Dr, Gulf Breeze, FL 32563",
                "project_type": "Full Backyard",
                "description": "Complete backyard transformation: 600 sq ft freeform pool, outdoor kitchen with Big Green Egg and bar, gas fire pit with seating wall, landscape lighting package.",
                "status": "Bidding Phase",
                "budget_estimate": 175000,
                "start_date": date(2026, 2, 15),
                "target_completion": date(2026, 10, 1),
                "notes": "3D design approved. Bid packages sent to 4 contractors each.",
                "created_at": now - timedelta(days=42),
            },
            {
                "project_id": "proj_002",
                "lead_id": "lead_002",
                "client_name": "David Chen",
                "client_email": "david.chen@outlook.com",
                "client_phone": "251-555-0198",
                "property_address": "1290 Bay Front Ave, Daphne, AL 36526",
                "project_type": "Pool",
                "description": "Infinity-edge pool overlooking Mobile Bay with integrated spa and LED lighting.",
                "status": "3D Design",
                "budget_estimate": 110000,
                "start_date": date(2026, 3, 1),
                "target_completion": date(2026, 8, 15),
                "notes": "Drone survey complete. Working on 3D renders. Client wants to see 2 design options.",
                "created_at": now - timedelta(days=35),
            },
            {
                "project_id": "proj_003",
                "lead_id": "lead_005",
                "client_name": "Angela & Robert Foster",
                "client_email": "angela.foster@gmail.com",
                "client_phone": "251-555-0411",
                "property_address": "892 Old Shell Rd, Mobile, AL 36608",
                "project_type": "Full Backyard",
                "description": "Premium backyard: gunite pool with sun shelf, full outdoor kitchen with pizza oven, fire bowl feature, landscape lighting throughout, custom pergola with motorized louvers.",
                "status": "Under Construction",
                "budget_estimate": 265000,
                "actual_cost": 142000,
                "start_date": date(2026, 1, 10),
                "target_completion": date(2026, 9, 30),
                "notes": "Pool shell complete. Outdoor kitchen framing in progress. On schedule.",
                "created_at": now - timedelta(days=58),
            },
            {
                "project_id": "proj_004",
                "lead_id": "lead_012",
                "client_name": "Richard & Anne Collins",
                "client_email": "rcollins@gmail.com",
                "client_phone": "850-555-1156",
                "property_address": "8900 Escambia River Rd, Milton, FL 32583",
                "project_type": "Full Backyard",
                "description": "5-acre property: pool, outdoor living pavilion, half-court basketball, landscape lighting, and native plant landscaping.",
                "status": "Drone Survey",
                "budget_estimate": 155000,
                "start_date": date(2026, 4, 1),
                "target_completion": date(2026, 12, 15),
                "notes": "Large property — scheduling 2-day drone survey. Client has approved the scope.",
                "created_at": now - timedelta(days=50),
            },
            {
                "project_id": "proj_005",
                "lead_id": None,
                "client_name": "The Wilson Family",
                "client_email": "wilsonfamily@gmail.com",
                "client_phone": "850-555-1390",
                "property_address": "3200 Summit Blvd, Pensacola, FL 32503",
                "project_type": "Pool",
                "description": "Classic rectangular pool with spa and travertine deck. Landscape refresh around pool area.",
                "status": "Completed",
                "budget_estimate": 92000,
                "actual_cost": 89500,
                "start_date": date(2025, 9, 15),
                "target_completion": date(2026, 2, 1),
                "notes": "Project completed on time and under budget. Client very happy — already referring neighbors.",
                "created_at": now - timedelta(days=180),
            },
            {
                "project_id": "proj_006",
                "lead_id": None,
                "client_name": "Dr. Patel",
                "client_email": "drpatel@gmail.com",
                "client_phone": "850-555-1445",
                "property_address": "7800 Scenic Hwy, Pensacola, FL 32504",
                "project_type": "Outdoor Kitchen",
                "description": "High-end outdoor kitchen with Wolf grill, built-in smoker, kegerator, and granite countertops.",
                "status": "Final Inspection",
                "budget_estimate": 68000,
                "actual_cost": 71200,
                "start_date": date(2026, 1, 20),
                "target_completion": date(2026, 4, 15),
                "notes": "Kitchen complete. Final punch list walk-through scheduled for next week.",
                "created_at": now - timedelta(days=90),
            },
        ]

        for pd_item in projects_data:
            db.add(models.Project(**pd_item))

        # ── Tasks for projects ────────────────────────────────────────
        task_templates = [
            "Schedule drone survey",
            "Complete drone survey",
            "Process photogrammetry data",
            "Create initial 3D design",
            "Client review meeting",
            "Apply revisions",
            "Finalize design",
            "Prepare bid package",
            "Send bid invitations",
            "Review bids with client",
        ]

        # proj_001 (Bidding Phase) — most tasks done
        for i, title in enumerate(task_templates):
            status = "completed" if i < 8 else ("in_progress" if i == 8 else "pending")
            db.add(models.Task(
                project_id="proj_001", title=title, sort_order=i,
                status=status,
                completed_at=now - timedelta(days=max(1, 42 - i * 4)) if status == "completed" else None,
            ))

        # proj_002 (3D Design) — first 4 tasks done
        for i, title in enumerate(task_templates):
            status = "completed" if i < 3 else ("in_progress" if i == 3 else "pending")
            db.add(models.Task(
                project_id="proj_002", title=title, sort_order=i,
                status=status,
                completed_at=now - timedelta(days=max(1, 30 - i * 5)) if status == "completed" else None,
            ))

        # proj_003 (Under Construction) — all design tasks done, plus construction tasks
        for i, title in enumerate(task_templates):
            db.add(models.Task(
                project_id="proj_003", title=title, sort_order=i,
                status="completed",
                completed_at=now - timedelta(days=max(1, 55 - i * 5)),
            ))
        construction_tasks = [
            "Excavation & grading", "Pool shell construction", "Outdoor kitchen framing",
            "Electrical rough-in", "Plumbing rough-in", "Pergola installation",
            "Decking & hardscape", "Landscape planting", "Lighting installation", "Final walkthrough",
        ]
        for i, title in enumerate(construction_tasks):
            status = "completed" if i < 3 else ("in_progress" if i == 3 else "pending")
            db.add(models.Task(
                project_id="proj_003", title=title, sort_order=10 + i,
                status=status,
                completed_at=now - timedelta(days=max(1, 20 - i * 3)) if status == "completed" else None,
            ))

        # proj_004 (Drone Survey) — first task in progress
        for i, title in enumerate(task_templates):
            status = "completed" if i == 0 else ("in_progress" if i == 1 else "pending")
            db.add(models.Task(
                project_id="proj_004", title=title, sort_order=i,
                status=status,
                completed_at=now - timedelta(days=5) if status == "completed" else None,
            ))

        # proj_005 (Completed) — all tasks done
        for i, title in enumerate(task_templates):
            db.add(models.Task(
                project_id="proj_005", title=title, sort_order=i,
                status="completed",
                completed_at=now - timedelta(days=max(1, 170 - i * 15)),
            ))

        # proj_006 (Final Inspection) — all tasks done
        for i, title in enumerate(task_templates):
            db.add(models.Task(
                project_id="proj_006", title=title, sort_order=i,
                status="completed",
                completed_at=now - timedelta(days=max(1, 80 - i * 8)),
            ))

        # ── Bid Packages & Bids ───────────────────────────────────────

        # Henderson project (Bidding Phase) — Pool Construction
        db.add(models.BidPackage(
            package_id="bp_001",
            project_id="proj_001",
            title="Pool Construction - Henderson",
            scope_of_work="Construct 600 sq ft freeform gunite pool with integrated spa, sun shelf, LED color lighting, and travertine coping. Includes all plumbing, electrical, and equipment.",
            material_specs="Gunite shell, Pebble Tec finish (Midnight Blue), travertine coping and deck, Pentair equipment package",
            site_conditions="Sandy soil, water table at 8ft, no rock. Good access for equipment.",
            timeline_requirements="12-14 weeks from permit approval",
            deadline=date(2026, 5, 15),
            status="Open",
        ))

        # Henderson — Outdoor Kitchen
        db.add(models.BidPackage(
            package_id="bp_002",
            project_id="proj_001",
            title="Outdoor Kitchen & Fire Pit - Henderson",
            scope_of_work="Build outdoor kitchen with Big Green Egg station, gas grill, sink, mini fridge, granite countertops, and bar with 4 seats. Plus gas fire pit with natural stone seating wall (8ft diameter).",
            material_specs="Stacked stone veneer, granite countertops, stainless steel appliances",
            site_conditions="Level ground, gas line available at property line",
            timeline_requirements="6-8 weeks, can run concurrent with pool",
            deadline=date(2026, 5, 15),
            status="Open",
        ))

        # Foster project — already awarded (Under Construction)
        db.add(models.BidPackage(
            package_id="bp_003",
            project_id="proj_003",
            title="Pool & Spa - Foster Estate",
            scope_of_work="Premium gunite pool with sun shelf, spa with spillover, LED lighting, automatic cover.",
            material_specs="Gunite shell, Pebble Tec (French Gray), natural stone coping",
            site_conditions="Large lot, good access, clay soil",
            timeline_requirements="14-16 weeks",
            deadline=date(2026, 1, 30),
            status="Awarded",
        ))

        # Bids for Henderson Pool (bp_001)
        bids_bp001 = [
            {
                "bid_id": "bid_001",
                "package_id": "bp_001",
                "contractor_id": "con_001",  # Gulf Coast Pools
                "total_price": 87500,
                "materials_cost": 42000,
                "labor_cost": 35000,
                "equipment_cost": 8500,
                "permit_cost": 2000,
                "proposed_timeline": "13 weeks",
                "warranty_terms": "Lifetime structural, 10-year surface, 3-year equipment",
                "notes": "Includes all Pentair IntelliCenter automation. We've done 3 pools on Soundside Dr.",
                "status": "Submitted",
                "submitted_at": now - timedelta(days=5),
            },
            {
                "bid_id": "bid_002",
                "package_id": "bp_001",
                "contractor_id": "con_007",  # Coastal Concrete
                "total_price": 92000,
                "materials_cost": 44500,
                "labor_cost": 37000,
                "equipment_cost": 8500,
                "permit_cost": 2000,
                "proposed_timeline": "14 weeks",
                "warranty_terms": "Lifetime structural, 10-year surface, 2-year equipment",
                "notes": "Can start within 2 weeks of contract signing. Premium concrete work included.",
                "status": "Submitted",
                "submitted_at": now - timedelta(days=4),
            },
            {
                "bid_id": "bid_003",
                "package_id": "bp_001",
                "contractor_id": "con_002",  # Emerald Coast Hardscapes
                "total_price": 78900,
                "materials_cost": 38000,
                "labor_cost": 32000,
                "equipment_cost": 7400,
                "permit_cost": 1500,
                "proposed_timeline": "12 weeks",
                "warranty_terms": "Lifetime structural, 8-year surface, 2-year equipment",
                "notes": "Competitive pricing with quality materials. Subcontracting pool shell to certified builder.",
                "status": "Submitted",
                "submitted_at": now - timedelta(days=3),
            },
        ]
        for bd in bids_bp001:
            db.add(models.Bid(**bd))

        # Bids for Henderson Outdoor Kitchen (bp_002)
        bids_bp002 = [
            {
                "bid_id": "bid_004",
                "package_id": "bp_002",
                "contractor_id": "con_003",  # Southern Outdoor Kitchens
                "total_price": 48500,
                "materials_cost": 26000,
                "labor_cost": 18000,
                "equipment_cost": 3000,
                "permit_cost": 1500,
                "proposed_timeline": "7 weeks",
                "warranty_terms": "5-year workmanship, manufacturer warranties on all appliances",
                "notes": "Includes Big Green Egg XL, Blaze 4-burner grill, Summerset sink. Fire pit with natural gas.",
                "status": "Submitted",
                "submitted_at": now - timedelta(days=4),
            },
            {
                "bid_id": "bid_005",
                "package_id": "bp_002",
                "contractor_id": "con_007",  # Coastal Concrete
                "total_price": 52000,
                "materials_cost": 28500,
                "labor_cost": 19500,
                "equipment_cost": 2500,
                "permit_cost": 1500,
                "proposed_timeline": "8 weeks",
                "warranty_terms": "5-year workmanship, manufacturer warranties",
                "notes": "Custom masonry with premium stone veneer. Can coordinate with pool schedule.",
                "status": "Submitted",
                "submitted_at": now - timedelta(days=3),
            },
        ]
        for bd in bids_bp002:
            db.add(models.Bid(**bd))

        # Bids for Foster Pool (bp_003) — awarded
        bids_bp003 = [
            {
                "bid_id": "bid_006",
                "package_id": "bp_003",
                "contractor_id": "con_001",  # Gulf Coast Pools — AWARDED
                "total_price": 125000,
                "materials_cost": 62000,
                "labor_cost": 48000,
                "equipment_cost": 12000,
                "permit_cost": 3000,
                "proposed_timeline": "15 weeks",
                "warranty_terms": "Lifetime structural, 10-year surface, 5-year equipment",
                "notes": "Premium build with Pebble Tec French Gray, natural stone, auto cover. Our best work.",
                "status": "Awarded",
                "submitted_at": now - timedelta(days=60),
            },
            {
                "bid_id": "bid_007",
                "package_id": "bp_003",
                "contractor_id": "con_002",
                "total_price": 132000,
                "materials_cost": 65000,
                "labor_cost": 52000,
                "equipment_cost": 12000,
                "permit_cost": 3000,
                "proposed_timeline": "16 weeks",
                "warranty_terms": "Lifetime structural, 10-year surface, 3-year equipment",
                "notes": "Includes premium hardscape package around pool area.",
                "status": "Declined",
                "submitted_at": now - timedelta(days=59),
            },
        ]
        for bd in bids_bp003:
            db.add(models.Bid(**bd))

        # ── Activity Log ──────────────────────────────────────────────
        activities = [
            ("lead", "lead_010", "created", "New lead: William Dupree from instagram", now - timedelta(days=1)),
            ("lead", "lead_011", "created", "New lead: Diana & Frank Martinez from google", now - timedelta(days=2)),
            ("lead", "lead_007", "created", "New lead: Mike & Jennifer Adams from facebook", now - timedelta(days=3)),
            ("bid", "bid_003", "created", "Bid submitted by Emerald Coast Hardscapes for Henderson Pool", now - timedelta(days=3)),
            ("bid", "bid_002", "created", "Bid submitted by Coastal Concrete & Masonry for Henderson Pool", now - timedelta(days=4)),
            ("bid", "bid_004", "created", "Bid submitted by Southern Outdoor Kitchens for Henderson Kitchen", now - timedelta(days=4)),
            ("bid", "bid_001", "created", "Bid submitted by Gulf Coast Pools & Spas for Henderson Pool", now - timedelta(days=5)),
            ("lead", "lead_009", "status_changed", "Status: New Lead -> Contacted", now - timedelta(days=5)),
            ("lead", "lead_006", "status_changed", "Status: New Lead -> Contacted", now - timedelta(days=7)),
            ("project", "proj_002", "status_changed", "Status: Drone Survey -> 3D Design", now - timedelta(days=10)),
            ("lead", "lead_004", "status_changed", "Status: Contacted -> Site Visit Scheduled", now - timedelta(days=12)),
            ("project", "proj_003", "status_changed", "Status: Contractor Selection -> Under Construction", now - timedelta(days=15)),
            ("bid", "bid_006", "awarded", "Bid awarded to Gulf Coast Pools & Spas for Foster Pool", now - timedelta(days=20)),
            ("lead", "lead_003", "status_changed", "Status: Qualified -> Proposal Sent", now - timedelta(days=18)),
            ("project", "proj_001", "status_changed", "Status: Client Review -> Bidding Phase", now - timedelta(days=14)),
            ("lead", "lead_001", "converted", "Lead converted to project proj_001", now - timedelta(days=42)),
            ("lead", "lead_005", "converted", "Lead converted to project proj_003", now - timedelta(days=58)),
            ("project", "proj_006", "status_changed", "Status: Under Construction -> Final Inspection", now - timedelta(days=8)),
            ("lead", "lead_008", "status_changed", "Status: Contacted -> Qualified", now - timedelta(days=10)),
            ("project", "proj_004", "created", "New project: Richard & Anne Collins", now - timedelta(days=50)),
        ]

        for entity_type, entity_id, action, details, created_at in activities:
            db.add(models.ActivityLog(
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                details=details,
                created_at=created_at,
            ))

        db.commit()
        print(f"Demo data seeded: {len(leads_data)} leads, {len(projects_data)} projects, "
              f"{len(contractors_data)} contractors, 3 bid packages, 7 bids, {len(activities)} activity entries")

    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data: {e}")
        raise
    finally:
        db.close()
