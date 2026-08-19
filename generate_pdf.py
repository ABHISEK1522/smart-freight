import sys
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#736657"))

        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.drawString(40, 804, "SMART FREIGHT  //  PROJECT INFORMATION BRIEF FOR PPT & DESIGN TEAM")
            self.setStrokeColor(colors.HexColor("#D8C8B4"))
            self.setLineWidth(0.6)
            self.line(40, 798, 555, 798)

        # Footer (All Pages)
        self.setStrokeColor(colors.HexColor("#D8C8B4"))
        self.setLineWidth(0.6)
        self.line(40, 38, 555, 38)

        self.setFont("Helvetica", 7.5)
        footer_text_left = "CONFIDENTIAL  //  SMART FREIGHT MULTIMODAL PLATFORM BRIEF"
        footer_text_right = f"Page {self._pageNumber} of {page_count}"
        self.drawString(40, 27, footer_text_left)
        self.drawRightString(555, 27, footer_text_right)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    PRIMARY = colors.HexColor("#1F1D1A")
    SECONDARY = colors.HexColor("#4A3B32")
    TERRACOTTA = colors.HexColor("#C85A32")
    OLIVE = colors.HexColor("#385E2E")
    BG_PARCHMENT = colors.HexColor("#FAF3E7")
    BORDER_COLOR = colors.HexColor("#DCCFBC")
    TEXT_MUTED = colors.HexColor("#6E5F52")

    # Typography
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=TERRACOTTA,
        spaceAfter=8
    )

    meta_badge_style = ParagraphStyle(
        'MetaBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=SECONDARY,
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.2,
        textColor=PRIMARY,
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=PRIMARY
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#FFFFFF")
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.8,
        textColor=PRIMARY
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.8,
        textColor=PRIMARY
    )

    story = []

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE 1: TITLE BANNER, SUMMARY, PROBLEM, SOLUTION & CAPABILITIES
    # ══════════════════════════════════════════════════════════════════════════
    header_table_data = [
        [
            Paragraph("SMART FREIGHT", title_style),
            Paragraph("<b>PROJECT BRIEF</b><br/><font size=6.5 color='#6E5F52'>DOCUMENT V2.4 // PPT TEAM</font>", meta_badge_style)
        ]
    ]
    t_header = Table(header_table_data, colWidths=[385, 130])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)

    story.append(Paragraph("AI-Based Multimodal Freight Consolidation and Cold-Chain Risk Prediction for MSMEs and Agricultural Logistics", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=TERRACOTTA, spaceAfter=6))

    # Executive Summary Box
    overview_text = (
        "<b>Executive Summary:</b> Smart Freight is an intelligent logistics planning platform designed to solve a critical "
        "inefficiency in Indian transport: <b>high shipping costs and perishable agricultural waste caused by partially filled, "
        "uncoordinated freight trips</b>. By evaluating cargo volume, highway corridors, delivery deadlines, and refrigeration constraints together, "
        "Smart Freight consolidates smaller shipments into optimal, shared highway journeys."
    )
    t_box = Table([[Paragraph(overview_text, callout_style)]], colWidths=[515])
    t_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_PARCHMENT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_box)
    story.append(Spacer(1, 4))

    # Section 1: The Problem
    story.append(Paragraph("1. The Real-World Problem", h1_style))
    story.append(Paragraph("Small farmers, mandi traders, and MSMEs face significant structural logistics bottlenecks:", body_style))
    story.append(Paragraph("• <b>Fragmented Small Shipments:</b> Small businesses rarely have enough volume to fill a full 10-ton or 16-ton truck on their own.", bullet_style))
    story.append(Paragraph("• <b>Wasted Vehicle Capacity:</b> Commercial trucks frequently travel 30% to 50% empty, raising per-kg freight costs.", bullet_style))
    story.append(Paragraph("• <b>High Operational Expenses:</b> Dispatching separate half-empty trucks multiplies fuel usage, highway tolls, and driver fees.", bullet_style))
    story.append(Paragraph("• <b>High Spoilage Vulnerability:</b> Perishable produce (fruits, dairy, vegetables) easily spoils without temperature monitoring and fast routing.", bullet_style))
    story.append(Paragraph("• <b>Unpredicted Corridor Delays:</b> Highway bottlenecks, weather hazards, and congestion cause delivery delays that compromise cargo value.", bullet_style))
    story.append(Paragraph("• <b>Lack of Accessible Tools:</b> Small producers lack enterprise software to easily coordinate shared trips with nearby shippers.", bullet_style))

    story.append(Spacer(1, 4))

    # Section 2: The Solution (Comparison Table)
    story.append(Paragraph("2. How Smart Freight Solves the Problem", h1_style))
    comp_table_data = [
        [
            Paragraph("<b>TRADITIONAL APPROACH (SEPARATE TRIPS)</b>", ParagraphStyle('H_Red', parent=table_cell_bold, textColor=colors.HexColor("#BA4336"))),
            Paragraph("<b>SMART FREIGHT APPROACH (CONSOLIDATED)</b>", ParagraphStyle('H_Green', parent=table_cell_bold, textColor=OLIVE))
        ],
        [
            Paragraph("• Shipper A (1.0 Ton) → Takes Truck 1 (Half Empty)<br/>"
                      "• Shipper B (2.5 Tons) → Takes Truck 2 (Half Empty)<br/>"
                      "• Shipper C (1.5 Tons) → Takes Truck 3 (Half Empty)<br/>"
                      "<b>Result:</b> 3 Separate Trucks, 3x Highway Tolls, High Combined Costs", table_cell_style),
            Paragraph("• Combined Payload: 5.0 Tons<br/>"
                      "• Matched with 1 Suitable 5-Ton Refrigerated Carrier<br/>"
                      "• Coordinated Highway Corridor (Bhubaneswar → Kolkata)<br/>"
                      "<b>Result:</b> 1 Shared Trip, 87.4% Fill-Rate, 33.3% Cost Savings", table_cell_style)
        ]
    ]
    t_comp = Table(comp_table_data, colWidths=[252, 263])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#FAF0EA")),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor("#EBF3EA")),
        ('BOX', (0,0), (0,-1), 1, colors.HexColor("#EAC8B8")),
        ('BOX', (1,0), (1,-1), 1, colors.HexColor("#C4DEC0")),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_comp)

    story.append(Spacer(1, 4))

    # Section 3: Capabilities Table
    story.append(Paragraph("3. Core Platform Capabilities", h1_style))
    cap_table_data = [
        [Paragraph("CAPABILITY", table_header_style), Paragraph("WHAT IT DOES", table_header_style), Paragraph("BENEFIT TO USERS", table_header_style)],
        [Paragraph("<b>Cargo Ingestion</b>", table_cell_bold), Paragraph("Captures payload weight, cargo type, pickup, drop & target SLA.", table_cell_style), Paragraph("Fast, seamless digital booking.", table_cell_style)],
        [Paragraph("<b>Vehicle Matching</b>", table_cell_bold), Paragraph("Evaluates available fleet capacity and cooling capabilities.", table_cell_style), Paragraph("Prevents cargo-carrier mismatching.", table_cell_style)],
        [Paragraph("<b>Freight Consolidation</b>", table_cell_bold), Paragraph("Groups compatible shipments along common highway corridors.", table_cell_style), Paragraph("Cuts individual shipping bills by ~33%.", table_cell_style)],
        [Paragraph("<b>Corridor Routing</b>", table_cell_bold), Paragraph("Computes exact road geometry and drive times via OSRM.", table_cell_style), Paragraph("Real highway navigation along NH-16.", table_cell_style)],
        [Paragraph("<b>Cost & Savings Engine</b>", table_cell_bold), Paragraph("Compares standalone trip pricing vs. consolidated rate.", table_cell_style), Paragraph("Instant transparent rupee savings breakdown.", table_cell_style)],
        [Paragraph("<b>Risk Prediction</b>", table_cell_bold), Paragraph("Analyzes congestion, weather, delay risk, and transit duration.", table_cell_style), Paragraph("Trips classified by risk tier (Low/Med/High).", table_cell_style)],
        [Paragraph("<b>Cold-Chain Guard</b>", table_cell_bold), Paragraph("Enforces 2°C - 8°C chilled rules for dairy, produce & pharma.", table_cell_style), Paragraph("Protects perishable goods from spoilage.", table_cell_style)],
        [Paragraph("<b>Dual Dashboards</b>", table_cell_bold), Paragraph("Connected portals for Shippers (Consumers) & Drivers.", table_cell_style), Paragraph("End-to-end operational visibility.", table_cell_style)],
    ]
    t_cap = Table(cap_table_data, colWidths=[100, 245, 170])
    t_cap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FDFBF7"), colors.HexColor("#FAF4EB")]),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_cap)

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE 2: WORKFLOW, MAIN FEATURES & DEMONSTRATION METRICS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. End-to-End Operational Workflow", h1_style))
    story.append(Paragraph("A seamless 9-step progression from initial booking to driver manifest execution:", body_style))

    workflow_steps = [
        ("Step 1: Cargo Input", "Shipper enters product name, payload (kg), pickup/destination, target delivery date & time."),
        ("Step 2: Requirement Analysis", "System classifies cargo type (e.g. Fresh Produce = Cold-Chain Reefer required, 2°C-8°C)."),
        ("Step 3: Fleet Capacity Scan", "Registry is scanned for eligible available vehicles matching payload and refrigeration needs."),
        ("Step 4: Corridor Consolidation", "Compatible shipments along the same route (e.g., NH-16 Odisha to West Bengal) are paired."),
        ("Step 5: Highway Route Optimization", "Street routing engine calculates exact road geometry, distance (km), and transit duration."),
        ("Step 6: Economic & Risk Modeling", "Calculates consolidated cost vs. standalone baseline, savings %, and evaluates route hazards."),
        ("Step 7: Plan Recommendation", "Presents optimal vehicle recommendation, transit schedule, verified savings, and risk grade."),
        ("Step 8: Shipment Confirmation", "Shipper confirms dispatch plan; details are saved into central database with tracking ID."),
        ("Step 9: Driver Manifest Execution", "Driver Portal receives turn-by-turn navigation, cargo handling notes, and delivery checkpoints.")
    ]

    wf_table_data = []
    for num_title, desc in workflow_steps:
        wf_table_data.append([
            Paragraph(f"<b>{num_title}</b>", ParagraphStyle('W_Title', parent=table_cell_bold, textColor=TERRACOTTA)),
            Paragraph(desc, table_cell_style)
        ])

    t_wf = Table(wf_table_data, colWidths=[135, 380])
    t_wf.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.HexColor("#FDFBF7"), colors.HexColor("#FAF5EC")]),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_wf)

    story.append(Spacer(1, 4))

    # Section 5: Main Features
    story.append(Paragraph("5. Main Platform Features", h1_style))
    features = [
        ("A. Dispatch Control Tower", "Live operational cockpit displaying corridor status, ready carrier assets, average consolidation yield, and cold-chain telemetry."),
        ("B. Shipment Dispatch Protocol", "Structured order creation interface with automatic payload validation, date-time targeting, and cargo classification."),
        ("C. Fleet Vehicle Matrix", "Real-time asset registry comparing vehicle capacities, eligible cargo fits, reefer capabilities, and direct savings potential."),
        ("D. Street Route Navigation Map", "Animated OpenStreetMap canvas illustrating real-world road geometry along Indian highway spines (NH-16) with transit replay."),
        ("E. Economic Cost Breakdown", "Clear financial waterfall comparing standalone trip pricing with the consolidated plan, highlighting exact net savings."),
        ("F. Multi-Factor Risk Predictor", "Assesses congestion, weather, delay risks, and cargo vulnerability to assign Low, Medium, or High risk tier status."),
        ("G. Cold-Chain Protection System", "Enforces 2°C-8°C chiller rules for perishables, dairy, and pharmaceuticals to minimize agricultural spoilage."),
        ("H. Connected Driver Portal", "Dedicated interface for drivers showing assigned vehicle ID, cargo manifest, pickup/delivery nodes, and trip status.")
    ]

    feat_table_data = []
    for f_title, f_desc in features:
        feat_table_data.append([
            Paragraph(f"<b>{f_title}</b>", table_cell_bold),
            Paragraph(f_desc, table_cell_style)
        ])

    t_feat = Table(feat_table_data, colWidths=[145, 370])
    t_feat.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.HexColor("#FDFBF7"), colors.HexColor("#FAF5EC")]),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_feat)

    story.append(Spacer(1, 4))

    # Section 6: Demonstration Metrics Strip
    story.append(Paragraph("6. Cost & Savings Demonstration Model", h1_style))
    story.append(Paragraph("Demonstration benchmark metrics illustrating platform consolidation economics:", body_style))

    metrics_table_data = [
        [
            Paragraph("<b>SEPARATE TRIPS</b><br/><font size=11 color='#1F1D1A'><b>Rs. 54,000</b></font><br/><font size=6.5 color='#6E5F52'>3 Standalone Dispatches</font>", table_cell_style),
            Paragraph("<b>CONSOLIDATED PLAN</b><br/><font size=11 color='#1F1D1A'><b>Rs. 36,000</b></font><br/><font size=6.5 color='#6E5F52'>1 Shared Optimized Trip</font>", table_cell_style),
            Paragraph("<b>ESTIMATED SAVINGS</b><br/><font size=11 color='#385E2E'><b>+Rs. 18,000</b></font><br/><font size=6.5 color='#385E2E'><b>+33.3% Net Discount</b></font>", table_cell_style),
            Paragraph("<b>CAPACITY FILL-RATE</b><br/><font size=11 color='#C85A32'><b>87.4%</b></font><br/><font size=6.5 color='#6E5F52'>Payload-to-Bed Fit</font>", table_cell_style)
        ]
    ]
    t_metrics = Table(metrics_table_data, colWidths=[128, 129, 129, 129])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_PARCHMENT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_metrics)

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE 3: RISK, COLD-CHAIN, DUAL DASHBOARD & TECH STACK
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("7. Multi-Factor Risk Prediction", h1_style))
    story.append(Paragraph(
        "Smart Freight evaluates more than just lowest-cost routing. It balances <b>Cost, Speed, Delivery Reliability, and Cargo Safety</b>:",
        body_style
    ))
    story.append(Paragraph("• <b>Highway Congestion Analysis:</b> Identifies peak congestion bottlenecks along national highway corridors.", bullet_style))
    story.append(Paragraph("• <b>Perishable Spoilage Risk:</b> Evaluates whether transit durations exceed the safe holding window for chilled produce.", bullet_style))
    story.append(Paragraph("• <b>Highway Road Quality:</b> Considers route surface conditions, ongoing highway maintenance, and terrain hazards.", bullet_style))
    story.append(Paragraph("• <b>Delivery SLA Compliance:</b> Flags tight delivery windows to prevent late arrival penalties at destination mandis.", bullet_style))

    story.append(Spacer(1, 4))

    story.append(Paragraph("8. Cold-Chain Logistics Safeguards", h1_style))
    story.append(Paragraph(
        "Agricultural goods such as milk, tomatoes, green vegetables, and seafood lose market value quickly if transported in ambient heat. "
        "Smart Freight integrates strict temperature rules directly into the dispatch engine, ensuring perishable goods are automatically "
        "routed to <b>Refrigerated (2°C – 8°C)</b> carrier units with monitored transit timelines.",
        body_style
    ))

    story.append(Spacer(1, 4))

    story.append(Paragraph("9. Connected Dual Experience: Consumer & Driver", h1_style))
    dual_table_data = [
        [
            Paragraph("<b>CONSUMER / SHIPPER DASHBOARD</b>", table_header_style),
            Paragraph("<b>DRIVER / FLEET OPERATOR DASHBOARD</b>", table_header_style)
        ],
        [
            Paragraph("• Plan & customize shipment requirements<br/>"
                      "• Compare vehicle types & capacity fits<br/>"
                      "• Review live savings and risk level ratings<br/>"
                      "• Save confirmed plans with tracking IDs<br/>"
                      "• Ledger history of all registered shipments", table_cell_style),
            Paragraph("• View assigned trip manifest & destination<br/>"
                      "• Turn-by-turn highway corridor route<br/>"
                      "• Cargo specifications & weight in kg<br/>"
                      "• Cold-chain chiller temperature target (2-8°C)<br/>"
                      "• Checkpoint delivery confirmation buttons", table_cell_style)
        ]
    ]
    t_dual = Table(dual_table_data, colWidths=[257, 258])
    t_dual.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BACKGROUND', (0,1), (0,1), colors.HexColor("#FDFBF7")),
        ('BACKGROUND', (1,1), (1,1), colors.HexColor("#FAF5EC")),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_dual)

    story.append(Spacer(1, 4))

    story.append(Paragraph("10. Technology Stack Summary", h1_style))
    tech_table_data = [
        [Paragraph("COMPONENT", table_header_style), Paragraph("TECHNOLOGY", table_header_style), Paragraph("PURPOSE IN SMART FREIGHT", table_header_style)],
        [Paragraph("<b>Frontend</b>", table_cell_bold), Paragraph("Next.js 16 + React 19", table_cell_style), Paragraph("Fast, responsive web portal for seamless client interaction.", table_cell_style)],
        [Paragraph("<b>Styling</b>", table_cell_bold), Paragraph("Tailwind CSS + Design System", table_cell_style), Paragraph("Warm, tactile Indian parchment aesthetic with clear hierarchy.", table_cell_style)],
        [Paragraph("<b>Data Visuals</b>", table_cell_bold), Paragraph("Recharts + Custom Canvas", table_cell_style), Paragraph("Visualizing cost waterfalls, risk radars & consolidation gains.", table_cell_style)],
        [Paragraph("<b>Mapping Engine</b>", table_cell_bold), Paragraph("Leaflet + OpenStreetMap", table_cell_style), Paragraph("Interactive highway corridor map with real-time transit simulation.", table_cell_style)],
        [Paragraph("<b>Backend API</b>", table_cell_bold), Paragraph("Python + FastAPI", table_cell_style), Paragraph("High-speed routing logic, consolidation matching & calculation.", table_cell_style)],
        [Paragraph("<b>Routing Network</b>", table_cell_bold), Paragraph("OSRM Engine", table_cell_style), Paragraph("Accurate street-level distances and transit time modeling.", table_cell_style)],
        [Paragraph("<b>Data Storage</b>", table_cell_bold), Paragraph("SQLite Database", table_cell_style), Paragraph("Persists registered shipments, fleet vehicles & user records.", table_cell_style)],
    ]
    t_tech = Table(tech_table_data, colWidths=[85, 140, 290])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FDFBF7"), colors.HexColor("#FAF4EB")]),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_tech)

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE 4: DIFFERENTIATION, IMPACT, CASE STUDY, FUTURE SCOPE & VISION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("11. What Makes Smart Freight Different?", h1_style))
    story.append(Paragraph("1. <b>Designed for MSMEs & Agriculture:</b> Tailored specifically for small producers who cannot afford dedicated fleets.", bullet_style))
    story.append(Paragraph("2. <b>Consolidation First:</b> Combines fragmented loads into shared trips rather than treating shipments in isolation.", bullet_style))
    story.append(Paragraph("3. <b>Cost + Risk Integrated:</b> Simultaneously models financial savings and perishable delivery risks.", bullet_style))
    story.append(Paragraph("4. <b>Built-in Cold-Chain Guard:</b> Automated reefer compliance protects perishable fruits, dairy, and perishables.", bullet_style))
    story.append(Paragraph("5. <b>Real Highway Corridors:</b> Uses actual road network geometry (NH-16 arterial) for accurate calculations.", bullet_style))
    story.append(Paragraph("6. <b>Two-Sided Connected Experience:</b> Unifies cargo owners and transport drivers on a single data backbone.", bullet_style))

    story.append(Spacer(1, 3))

    story.append(Paragraph("12. Target Beneficiaries", h1_style))
    story.append(Paragraph("• <b>Farmers & Agricultural Cooperatives:</b> Ship perishables to distant city mandis without incurring heavy losses.", bullet_style))
    story.append(Paragraph("• <b>MSMEs & Small Manufacturers:</b> Transport small industrial batches at discounted consolidated rates.", bullet_style))
    story.append(Paragraph("• <b>Dairy & Cold-Chain Shippers:</b> Gain reliable temperature-controlled refrigerated transport.", bullet_style))
    story.append(Paragraph("• <b>Fleet Operators & Drivers:</b> Eliminate empty return miles and maximize revenue per truck-bed kilometer.", bullet_style))
    story.append(Paragraph("• <b>Mandi Traders & Aggregators:</b> Coordinate daily regional freight dispatches with complete digital transparency.", bullet_style))

    story.append(Spacer(1, 3))

    story.append(Paragraph("13. Potential Real-World Impact", h1_style))
    story.append(Paragraph("• <b>Economic:</b> Can reduce transportation costs for small shippers by up to 30%–35% while increasing vehicle utilization to over 85%.", bullet_style))
    story.append(Paragraph("• <b>Operational:</b> Replaces chaotic phone brokerages with automated, transparent highway matching.", bullet_style))
    story.append(Paragraph("• <b>Agricultural:</b> Helps mitigate post-harvest food waste through cold-chain compliance and route risk analysis.", bullet_style))
    story.append(Paragraph("• <b>Environmental:</b> Fewer underutilized trucks on highways can potentially reduce aggregate diesel consumption and carbon emissions.", bullet_style))

    story.append(Spacer(1, 3))

    story.append(Paragraph("14. Illustrative Example: Odisha to West Bengal Corridor", h1_style))
    story.append(Paragraph(
        "<b>Scenario:</b> Three independent Odisha businesses need to send goods to Kolkata along the NH-16 corridor:<br/>"
        "• <i>Shipper 1 (Cuttack Mandi):</i> 1,200 kg fresh tomatoes (Chilled required)<br/>"
        "• <i>Shipper 2 (Bhubaneswar Co-op):</i> 800 kg packaged dairy (Chilled required)<br/>"
        "• <i>Shipper 3 (Balasore Trader):</i> 1,500 kg processed food (Chilled required)<br/>"
        "<b>Traditional Method:</b> 3 separate trucks booked = Rs. 54,000 total cost, 3 half-empty vehicles on the road.<br/>"
        "<b>Smart Freight Plan:</b> Consolidates all 3 into one 5,000 kg Refrigerated Truck (3,500 kg total payload).<br/>"
        "<b>Consolidated Cost:</b> Rs. 36,000 | <b>Total Net Savings:</b> Rs. 18,000 (+33.3% savings) | <b>Capacity Fit:</b> 87.5%.",
        body_style
    ))

    story.append(Spacer(1, 3))

    story.append(Paragraph("15. Future Scope & Roadmap", h1_style))
    story.append(Paragraph("<i>(Planned future extensions beyond the current core platform)</i>", ParagraphStyle('Sub_Italic', parent=body_style, textColor=TEXT_MUTED)))
    story.append(Paragraph("• <b>IoT Sensor Telemetry:</b> Live streaming of temperature and humidity from physical container sensors.", bullet_style))
    story.append(Paragraph("• <b>Real-Time GPS Fleet Tracking:</b> Live satellite vehicle positioning and geofencing alerts.", bullet_style))
    story.append(Paragraph("• <b>Dynamic Highway Feeds:</b> Live traffic and weather feeds for real-time en-route detour suggestions.", bullet_style))
    story.append(Paragraph("• <b>Machine Learning Demand Forecasting:</b> Predictive demand modeling aligned with seasonal agricultural harvest cycles.", bullet_style))
    story.append(Paragraph("• <b>Multimodal Rail-Road Integration:</b> Extending consolidation algorithms to Dedicated Freight Corridors (DFCs).", bullet_style))

    story.append(Spacer(1, 3))

    story.append(Paragraph("16. Final Vision & Presentation Takeaways", h1_style))
    vision_text = (
        "<b>Project Vision:</b> <i>\"SMART FREIGHT aims to democratize freight logistics by making transportation smarter, "
        "more affordable, safer, and highly coordinated for the farmers, MSMEs, and transport operators who power the nation's economy.\"</i>"
    )
    t_vision = Table([[Paragraph(vision_text, callout_style)]], colWidths=[515])
    t_vision.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EBF3EA")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#C4DEC0")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_vision)

    story.append(Spacer(1, 3))

    takeaways = (
        "<b>Slide Deck Summary Takeaways:</b><br/>"
        "• <b>The Problem:</b> Fragmented small shipments = wasted truck space + 3x costs + food spoilage.<br/>"
        "• <b>The Solution:</b> AI-assisted consolidation + cold-chain protection + corridor route risk analysis.<br/>"
        "• <b>The Outcome:</b> ~33% cost savings, 85%+ vehicle fill rate, lower spoilage, and unified digital control."
    )
    story.append(Paragraph(takeaways, body_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")

if __name__ == "__main__":
    output_path = sys.argv[1] if len(sys.argv) > 1 else "Smart_Freight_Project_Brief.pdf"
    build_pdf(output_path)
