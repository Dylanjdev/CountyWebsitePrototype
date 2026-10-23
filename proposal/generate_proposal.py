#!/usr/bin/env python3
"""Generate the Lee County website redesign proposal PDF.

Install the only runtime dependency with:
    python3 -m pip install reportlab

Then run from the LeeCounty project root:
    python3 proposal/generate_proposal.py
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "proposal" / "assets"
OUTPUT_DIR = ROOT / "proposal" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT = OUTPUT_DIR / "Lee_County_Website_Redesign_Proposal_Dylan_Smith.pdf"

PAGE_W, PAGE_H = letter
MARGIN = 54
CONTENT_W = PAGE_W - (MARGIN * 2)

FOREST = HexColor("#07372E")
FOREST_2 = HexColor("#0E5144")
FOREST_3 = HexColor("#176B59")
GOLD = HexColor("#C79B4B")
GOLD_LIGHT = HexColor("#E5C982")
CREAM = HexColor("#F5F1E8")
INK = HexColor("#17231F")
MUTED = HexColor("#58655F")
LINE = HexColor("#D9DDD9")
PALE_GREEN = HexColor("#EAF2EF")
PALE_GOLD = HexColor("#FBF5E8")
PALE_RED = HexColor("#F8ECE9")
WHITE = colors.white


def register_fonts():
    font_dir = Path("/System/Library/Fonts/Supplemental")
    fonts = {
        "Arial": "Arial.ttf",
        "Arial-Bold": "Arial Bold.ttf",
        "Arial-Italic": "Arial Italic.ttf",
        "Georgia": "Georgia.ttf",
        "Georgia-Bold": "Georgia Bold.ttf",
        "Georgia-Italic": "Georgia Italic.ttf",
    }
    for name, filename in fonts.items():
        path = font_dir / filename
        if path.exists():
            pdfmetrics.registerFont(TTFont(name, str(path)))


register_fonts()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="BodyLee",
    fontName="Arial",
    fontSize=9.25,
    leading=14.2,
    textColor=INK,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="BodySmall",
    parent=styles["BodyLee"],
    fontSize=8,
    leading=11.5,
    spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="Eyebrow",
    fontName="Arial-Bold",
    fontSize=7.4,
    leading=9,
    textColor=FOREST_3,
    tracking=1.45,
    spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="SectionTitle",
    fontName="Georgia",
    fontSize=25,
    leading=29,
    textColor=FOREST,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="SectionLead",
    fontName="Arial",
    fontSize=10.2,
    leading=15.2,
    textColor=MUTED,
    spaceAfter=15,
))
styles.add(ParagraphStyle(
    name="H2Lee",
    fontName="Georgia-Bold",
    fontSize=14,
    leading=17,
    textColor=FOREST,
    spaceBefore=8,
    spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="H3Lee",
    fontName="Arial-Bold",
    fontSize=9.2,
    leading=12,
    textColor=FOREST_2,
    spaceBefore=5,
    spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="TableHead",
    fontName="Arial-Bold",
    fontSize=7.7,
    leading=9.5,
    textColor=WHITE,
))
styles.add(ParagraphStyle(
    name="TableCell",
    fontName="Arial",
    fontSize=7.35,
    leading=10.1,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="TableCellBold",
    parent=styles["TableCell"],
    fontName="Arial-Bold",
    textColor=FOREST,
))
styles.add(ParagraphStyle(
    name="StatNumber",
    fontName="Georgia-Bold",
    fontSize=18,
    leading=20,
    textColor=FOREST,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="StatLabel",
    fontName="Arial-Bold",
    fontSize=6.4,
    leading=8.2,
    textColor=MUTED,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="CalloutTitle",
    fontName="Arial-Bold",
    fontSize=9,
    leading=11,
    textColor=FOREST,
    spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="Quote",
    fontName="Georgia-Italic",
    fontSize=12,
    leading=18,
    textColor=FOREST,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="Tiny",
    fontName="Arial",
    fontSize=6.5,
    leading=8.4,
    textColor=MUTED,
))


def P(text, style="BodyLee"):
    return Paragraph(text, styles[style])


def bullet_list(items, level=0):
    return ListFlowable(
        [ListItem(P(item, "BodyLee"), leftIndent=0) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=15 + (level * 8),
        bulletFontName="Arial",
        bulletFontSize=6,
        bulletColor=GOLD,
        spaceAfter=7,
    )


def section(eyebrow, title, lead=None):
    items = [P(eyebrow.upper(), "Eyebrow"), P(title, "SectionTitle")]
    if lead:
        items.append(P(lead, "SectionLead"))
    items.append(HRFlowable(width="100%", thickness=1.2, color=GOLD, spaceAfter=14))
    return items


def callout(title, body, background=PALE_GREEN, border=FOREST_3):
    data = [[P(title, "CalloutTitle"), P(body, "BodySmall")]]
    table = Table(data, colWidths=[118, CONTENT_W - 118])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.7, border),
        ("LINEBEFORE", (0, 0), (0, -1), 4, border),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


def styled_table(rows, widths, header=True, font_size=None, repeats=1):
    converted = []
    for ridx, row in enumerate(rows):
        style_name = "TableHead" if header and ridx == 0 else "TableCell"
        converted.append([
            value if hasattr(value, "wrap") else P(str(value), style_name)
            for value in row
        ])
    table = Table(converted, colWidths=widths, repeatRows=repeats if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), FOREST),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("LINEBELOW", (0, 0), (-1, 0), 1, GOLD),
        ]
        start = 1
    else:
        start = 0
    for ridx in range(start, len(rows)):
        if (ridx - start) % 2:
            commands.append(("BACKGROUND", (0, ridx), (-1, ridx), HexColor("#F7F8F5")))
    table.setStyle(TableStyle(commands))
    return table


def fit_image(path, max_width, max_height):
    reader = ImageReader(str(path))
    width, height = reader.getSize()
    ratio = min(max_width / width, max_height / height)
    return Image(str(path), width=width * ratio, height=height * ratio)


def draw_cropped_image(canvas, path, x, y, width, height):
    reader = ImageReader(str(path))
    iw, ih = reader.getSize()
    scale = max(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    canvas.saveState()
    canvas.rect(x, y, width, height, stroke=0, fill=0)
    canvas.clipPath(canvas.beginPath()) if False else None
    canvas.drawImage(reader, x + (width - dw) / 2, y + (height - dh) / 2,
                     width=dw, height=dh, preserveAspectRatio=True, mask="auto")
    canvas.restoreState()


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setTitle("Website Redesign and Development Proposal — County of Lee, Virginia")
    canvas.setAuthor("Dylan Smith")
    canvas.setSubject("Response to Lee County, Virginia RFP dated September 21, 2026")
    canvas.setCreator("Dylan Smith")

    hero = ASSETS / "lee-county-hero.jpg"
    canvas.drawImage(str(hero), 0, 330, width=PAGE_W, height=462, preserveAspectRatio=False, mask="auto")
    try:
        canvas.setFillAlpha(0.70)
    except AttributeError:
        pass
    canvas.setFillColor(FOREST)
    canvas.rect(0, 330, PAGE_W, 462, fill=1, stroke=0)
    try:
        canvas.setFillAlpha(1)
    except AttributeError:
        pass

    logo = ASSETS / "lee-logo.png"
    canvas.setFillColor(WHITE)
    canvas.roundRect(MARGIN, 695, 72, 62, 4, fill=1, stroke=0)
    canvas.drawImage(str(logo), MARGIN + 10, 700, width=52, height=47, preserveAspectRatio=True, mask="auto")

    canvas.setFillColor(GOLD_LIGHT)
    canvas.setFont("Arial-Bold", 7.5)
    canvas.drawString(MARGIN, 660, "SEALED PROPOSAL • WEBSITE REDESIGN SERVICES")

    canvas.setFillColor(WHITE)
    canvas.setFont("Georgia", 34)
    canvas.drawString(MARGIN, 602, "A clearer path to")
    canvas.setFont("Georgia-Bold", 42)
    canvas.drawString(MARGIN, 553, "county services.")
    canvas.setFont("Arial", 11)
    canvas.setFillColor(HexColor("#DFEAE6"))
    canvas.drawString(MARGIN, 516, "Website redesign and development proposal")
    canvas.drawString(MARGIN, 499, "County of Lee, Virginia")

    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(2)
    canvas.line(MARGIN, 468, MARGIN + 82, 468)
    canvas.setFont("Arial", 8.4)
    canvas.setFillColor(HexColor("#D7E4DF"))
    cover_note = "A working Lee County prototype, a migration-ready public record archive, and a practical plan to launch."
    text_obj = canvas.beginText(MARGIN, 442)
    text_obj.setFont("Arial", 8.4)
    for line in (cover_note[:88], cover_note[88:]):
        text_obj.textLine(line.strip())
    canvas.drawText(text_obj)

    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, PAGE_W, 330, fill=1, stroke=0)
    canvas.setFillColor(FOREST)
    canvas.setFont("Georgia-Bold", 15)
    canvas.drawString(MARGIN, 280, "Prepared for")
    canvas.setFont("Arial-Bold", 9)
    canvas.drawString(MARGIN, 256, "CLINT CARTER, COUNTY ADMINISTRATOR")
    canvas.setFont("Arial", 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 238, "Lee County Courthouse • Room 111")
    canvas.drawString(MARGIN, 223, "33640 Main Street • Jonesville, Virginia 24263")

    canvas.setFillColor(FOREST)
    canvas.setFont("Georgia-Bold", 15)
    canvas.drawString(330, 280, "Prepared by")
    canvas.setFont("Arial-Bold", 9)
    canvas.drawString(330, 256, "DYLAN SMITH • INDEPENDENT WEB DEVELOPER")
    canvas.setFont("Arial", 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(330, 238, "dylanjsmith.dev@gmail.com")
    canvas.drawString(330, 223, "October 5, 2026")

    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN, 184, PAGE_W - MARGIN, 184)
    canvas.setFillColor(MUTED)
    canvas.setFont("Arial", 7.5)
    canvas.drawString(MARGIN, 157, "RFP issued September 21, 2026")
    canvas.drawString(MARGIN, 143, "Proposal due October 15, 2026 at 2:00 p.m. ET")
    canvas.drawRightString(PAGE_W - MARGIN, 157, "Proposal ID: LC-WEB-2026-01")
    canvas.drawRightString(PAGE_W - MARGIN, 143, "Valid through December 31, 2026")

    canvas.setFillColor(FOREST)
    canvas.rect(0, 0, PAGE_W, 30, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Arial-Bold", 6.7)
    canvas.drawCentredString(PAGE_W / 2, 11, "PROPOSAL FOR WEBSITE REDESIGN SERVICES")
    canvas.restoreState()


def draw_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(FOREST)
    canvas.rect(0, PAGE_H - 18, PAGE_W, 18, fill=1, stroke=0)
    canvas.setFont("Arial-Bold", 6.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(MARGIN, PAGE_H - 12.2, "LEE COUNTY, VIRGINIA • WEBSITE REDESIGN PROPOSAL")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 35, PAGE_W - MARGIN, 35)
    canvas.setFont("Arial", 6.8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 21, "Dylan Smith • October 5, 2026 • LC-WEB-2026-01")
    canvas.drawRightString(PAGE_W - MARGIN, 21, f"{canvas.getPageNumber()}")
    canvas.restoreState()


doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=letter,
    rightMargin=MARGIN,
    leftMargin=MARGIN,
    topMargin=45,
    bottomMargin=45,
    title="Website Redesign and Development Proposal — County of Lee, Virginia",
    author="Dylan Smith",
    subject="Response to Lee County RFP dated September 21, 2026",
)

story = [Spacer(1, 680), PageBreak()]

# Executive summary and transmittal
story += section(
    "Executive response",
    "Designed around Lee County—not adapted after the award.",
    "This response pairs a county-specific working prototype with a disciplined completion plan for search, migration, accessibility, training, hosting, and launch.",
)
story += [
    P("October 5, 2026"),
    P("Clint Carter, County Administrator<br/>County of Lee, Virginia<br/>P.O. Box 367<br/>Jonesville, Virginia 24263"),
    Spacer(1, 3),
    P("<b>Re: Proposal for Website Redesign Services</b>"),
    P("Dear Mr. Carter:"),
    P("I am pleased to submit this proposal to redesign and develop Lee County's public website. Rather than respond with a generic template or a collection of promises, I began with the County's actual information: its departments, public notices, meetings, documents, calendar needs, and local identity. The result is a working prototype that gives the County a concrete product to evaluate before making an award."),
    P("The proposed site is organized around the questions residents bring to county government: where to find a service, how to contact an office, when a meeting will occur, how to review an agenda or minute book, where to locate an official notice, and how to submit or update public information. Its visual system uses Lee County's seal, landscape, and established civic character while keeping government information direct and easy to scan."),
]
story.append(callout(
    "A lower-risk starting point",
    "The prototype already includes a responsive public interface, department and service pathways, an administrative publishing area, current-notice workflows, a moderated calendar, and a structured Board of Supervisors archive. The remaining work is clearly identified and tied to milestones, demonstrations, and County acceptance.",
))
story += [
    Spacer(1, 11),
    P("The recommended fixed-fee implementation estimate is <b>$23,750</b>, with a projected <b>10-week turnaround</b> from notice to proceed and receipt of required content/access. The County may select optional hosting, ongoing support, or additional digital services separately."),
    P("Thank you for considering this locally informed, working-first approach. I welcome a technical demonstration and a line-by-line scope review with County staff."),
    Spacer(1, 10),
    P("Respectfully submitted,"),
    Spacer(1, 18),
    P("<b>Dylan Smith</b><br/>Independent Web Developer<br/>dylanjsmith.dev@gmail.com"),
    PageBreak(),
]

# Outcomes / proposal map
story += section(
    "What Lee County receives",
    "A public-service website with a practical operating model.",
    "The project is not limited to a visual refresh. It includes the content structure, staff tools, migration process, quality controls, training, and post-launch support needed to keep the site useful.",
)
outcome_rows = [
    [P("01", "StatNumber"), P("Findability", "H3Lee"), P("Task-based navigation, prominent search, department landing pages, cross-content results, and clean URLs.", "BodySmall")],
    [P("02", "StatNumber"), P("Transparency", "H3Lee"), P("Notices, bids, calendars, agendas, minutes, audio, budgets, and documents organized for public access.", "BodySmall")],
    [P("03", "StatNumber"), P("County control", "H3Lee"), P("Role-based publishing tools let authorized staff post, review, schedule, expire, and maintain content in-house.", "BodySmall")],
    [P("04", "StatNumber"), P("Migration confidence", "H3Lee"), P("Inventory, mapping, metadata cleanup, automated imports, manual review, redirect planning, and acceptance reports.", "BodySmall")],
    [P("05", "StatNumber"), P("Inclusive access", "H3Lee"), P("Responsive layouts, keyboard support, semantic markup, accessible documents guidance, and WCAG 2.2 AA validation.", "BodySmall")],
    [P("06", "StatNumber"), P("Durable operations", "H3Lee"), P("Managed hosting, security controls, backups, monitoring, documentation, training, and support options.", "BodySmall")],
]
outcome_table = Table(outcome_rows, colWidths=[42, 105, CONTENT_W - 147], hAlign="LEFT")
outcome_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
    ("BACKGROUND", (0, 0), (0, -1), PALE_GOLD),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [outcome_table, Spacer(1, 14), P("Proposal organization", "H2Lee")]
story.append(bullet_list([
    "RFP compliance and implementation status",
    "User experience, information architecture, CMS, search, SEO, and hosting",
    "Data and file migration, testing, accessibility, security, and launch",
    "Training, ongoing support, project team, qualifications, references disclosure, cost, and terms",
    "Submission checklist and signature page",
]))
story += [PageBreak()]

# RFP compliance matrix
story += section(
    "RFP compliance",
    "A direct response to the County's stated objectives.",
    "Every preliminary scope item and development objective is addressed below. Status labels distinguish demonstrated prototype work from contract completion work.",
)
compliance = [
    ["RFP requirement", "Proposed response", "Status"],
    ["Highly usable, dynamic design", "Task-first home page, service pathways, responsive components, department templates, and clear calls to action.", "Prototype + refine"],
    ["Transparency and customer service", "Prominent access to notices, bids, meetings, minutes, audio, budgets, calendars, contacts, and documents.", "Prototype"],
    ["Marketing, news, projects, events", "County-branded hero, update cards, event calendar, public notices, optional project pages and alerts.", "Prototype + content"],
    ["Consolidate and migrate content", "Crawl/inventory, content map, automated file import, metadata cleanup, manual QA, and 301 redirect register.", "Planned + partial"],
    ["Department and community needs", "Department discovery interviews, repeatable templates, service directory, shared publishing standards.", "Planned"],
    ["Government look + unique presence", "Lee County seal, local landscape, forest/gold palette, readable civic typography, restrained motion.", "Prototype"],
    ["Navigation and department pages", "User-centric menus, breadcrumbs, quick links, department landing pages, related resources, search.", "Prototype + content"],
    ["Desktop, tablet, mobile; browsers", "Responsive implementation; current and previous major browser versions; device test matrix before acceptance.", "Prototype + QA"],
    ["Hosting", "Managed static/application hosting, database and file storage, SSL, backups, monitoring, and domain cutover.", "Proposed"],
    ["SEO and smart site search", "Indexable HTML, sitemap, metadata, schema, PDF text indexing, typo tolerance, phrase search, relevance, and facets.", "Interface exists; engine planned"],
    ["Knowledge transfer and training", "Admin guide, live role-based sessions, recordings, quick-reference sheets, sandbox exercises, 30-day support.", "Proposed"],
    ["In-house posting and maintenance", "Authenticated admin workspace for pages, notices, documents, meetings, and calendar moderation.", "Prototype + refine"],
]
story += [styled_table(compliance, [113, 305, 86]), Spacer(1, 12)]
story.append(callout(
    "Scope boundary honored",
    "Constitutional Officers and the Lee County Economic Development Authority remain on their separate websites. The redesigned site will provide clear, maintained outbound links and context without migrating or duplicating those sites.",
    PALE_GOLD,
    GOLD,
))
story += [PageBreak()]

# Prototype evidence
story += section(
    "Demonstrated progress",
    "The County can evaluate real work now.",
    "The current prototype establishes the visual direction and validates key publishing and public-record workflows before contract award.",
)
home_img = fit_image(ASSETS / "prototype-home.png", CONTENT_W, 350)
home_img.hAlign = "CENTER"
story += [home_img, Spacer(1, 7), P("Working prototype: public home page with county identity, task-oriented navigation, prominent search entry, and quick access to high-demand content.", "Tiny"), Spacer(1, 11)]
stats = Table([
    [P("678", "StatNumber"), P("519", "StatNumber"), P("152", "StatNumber"), P("2016–2026", "StatNumber")],
    [P("ARCHIVE FILES", "StatLabel"), P("PDF RECORDS", "StatLabel"), P("AUDIO RECORDS", "StatLabel"), P("YEARS ORGANIZED", "StatLabel")],
], colWidths=[CONTENT_W / 4] * 4)
stats.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), PALE_GREEN),
    ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
    ("TOPPADDING", (0, 0), (-1, 0), 9),
    ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
]))
story += [stats, Spacer(1, 12), P("Verified prototype capabilities", "H2Lee")]
story.append(bullet_list([
    "Public notice presentation with deadlines, expiration, featured status, contacts, links, and PDF attachments.",
    "Meeting archive organized by year, meeting type, record type, and keyword, with agendas, minutes, and audio.",
    "Document library and staff upload/publishing workflows backed by authenticated storage permissions.",
    "County calendar with public single-event and CSV submissions, validation, review, approval, rejection, and publishing.",
    "Administrative workspace for notices, meeting records, county documents, and event moderation.",
    "Successful production build and clean lint result as of October 5, 2026.",
]))
story += [PageBreak()]

story += section(
    "Demonstrated progress",
    "A public record archive built for the way people look for meetings.",
    "The archive is more than a folder of files: it presents a predictable year-based view and supports filtering by document type, meeting type, and search terms.",
)
meetings_img = fit_image(ASSETS / "prototype-meetings.png", CONTENT_W, 382)
meetings_img.hAlign = "CENTER"
story += [meetings_img, Spacer(1, 7), P("Working prototype: Board of Supervisors records organized by year, with document counts and public-facing archive context.", "Tiny"), Spacer(1, 11)]
story.append(callout(
    "Prototype is evidence—not a claim of completion",
    "The homepage search field currently demonstrates placement and interaction only. Contract work includes the production search index, PDF text extraction, typo tolerance, exact-phrase behavior, relevance tuning, content-type filters, analytics, and result-page accessibility required by the RFP.",
    PALE_GOLD,
    GOLD,
))
story += [Spacer(1, 13), P("Acceptance evidence at each milestone", "H2Lee")]
story.append(bullet_list([
    "A working URL on a protected staging environment",
    "A written requirement/status register and issue log",
    "Demonstrations using County content and realistic staff tasks",
    "Migration counts, broken-link checks, redirect register, browser/device results, and accessibility findings",
    "County sign-off before production cutover",
]))
story += [PageBreak()]

# UX and IA
story += section(
    "User experience",
    "Organized around resident tasks and staff ownership.",
    "The navigation model balances a stable government structure with direct paths to the information residents request most often.",
)
audiences = [
    ["Audience", "High-value tasks", "Design response"],
    ["Residents & property owners", "Services, forms, payments, notices, meetings, property/GIS, contacts", "Plain-language service paths, search, quick links, printable details"],
    ["Businesses & applicants", "Permits, zoning, bids, development, employment", "Topic pathways, department ownership, requirements and next steps"],
    ["Visitors & community groups", "Events, airport, tourism links, community resources", "Calendar, external partner links, location and contact context"],
    ["County staff", "Post, revise, schedule, approve, expire, archive", "Role-based admin, structured fields, previews, publishing states"],
    ["Search engines & assistive tech", "Understand content and relationships", "Semantic HTML, metadata, schema, headings, landmarks, alt text"],
]
story += [styled_table(audiences, [104, 196, 204]), Spacer(1, 13), P("Proposed top-level structure", "H2Lee")]
ia_rows = [
    [P("County Government", "TableCellBold"), P("Administration • Board of Supervisors • departments • elected officials • courts • county code", "TableCell")],
    [P("Services", "TableCellBold"), P("Building & inspections • zoning • mapping/GIS • recycling • forms • payments • employment", "TableCell")],
    [P("Public Information", "TableCellBold"), P("Notices • meetings • agendas • minutes • audio • bids • budgets • reports • policies", "TableCell")],
    [P("Community", "TableCellBold"), P("Calendar • airport • tourism • economic development • local and regional resources", "TableCell")],
]
ia_table = Table(ia_rows, colWidths=[126, CONTENT_W - 126])
ia_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
    ("BACKGROUND", (0, 0), (0, -1), PALE_GREEN),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [ia_table, Spacer(1, 12)]
story.append(callout(
    "Discovery decision points",
    "During kickoff, County staff will confirm top tasks, department owners, emergency publishing needs, required forms/integrations, records-retention expectations, approval roles, analytics goals, and which legacy pages should be rewritten, archived, redirected, or retired.",
))
story += [PageBreak()]

# CMS architecture
story += section(
    "CMS and technical approach",
    "Modern delivery without making routine updates technical.",
    "The recommended architecture separates the fast public website from authenticated content management, structured data, and document storage. County staff work in forms and previews—not source code.",
)
arch = Table([
    [P("PUBLIC EXPERIENCE", "TableHead"), P("CONTENT & WORKFLOW", "TableHead"), P("OPERATIONS", "TableHead")],
    [P("Responsive React interface<br/>Department and topic templates<br/>Accessible components<br/>Search results and filters", "BodySmall"),
     P("Supabase/PostgreSQL CMS<br/>Role-based sign-in<br/>Draft, review, publish, expire<br/>Documents and media storage", "BodySmall"),
     P("Managed hosting + SSL<br/>Backups and monitoring<br/>Analytics + error tracking<br/>Deployment and rollback", "BodySmall")],
], colWidths=[CONTENT_W / 3] * 3)
arch.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), FOREST),
    ("BACKGROUND", (0, 1), (-1, 1), PALE_GREEN),
    ("GRID", (0, 0), (-1, -1), 0.7, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story += [arch, Spacer(1, 14), P("Content types and controls", "H2Lee")]
cms_rows = [
    ["Content type", "Structured fields and workflow"],
    ["Department/service pages", "Owner, contact, overview, services, documents, related links, alerts, review date"],
    ["Public notices and bids", "Type, summary, body, posted/deadline/expiration dates, contact, submission details, attachment, featured flag"],
    ["Meetings and records", "Public body, meeting type/date, agenda/minutes/audio, publication state, accessible title and metadata"],
    ["Calendar events", "Schedule, all-day option, venue/address, category, link, description, submitter contact, moderation status"],
    ["Documents", "Category, title, description, document date, department, file, visibility, keywords, replacement/version notes"],
]
story += [styled_table(cms_rows, [135, CONTENT_W - 135]), Spacer(1, 11)]
story.append(bullet_list([
    "Least-privilege accounts and role checks for authorized County staff",
    "Preview before publishing and clear status labels",
    "Required-field, file-type, file-size, date, and URL validation",
    "Automatic expiration for time-sensitive notices and event moderation for public submissions",
    "Audit-friendly created/updated timestamps and accountable user identity",
    "Exportable structured data and County ownership of content and uploaded files",
]))
story += [PageBreak()]

# Search and SEO
story += section(
    "Search and discovery",
    "One search across pages, documents, events, and news.",
    "The production search experience will satisfy the RFP's detailed requirements and will be tested with real Lee County vocabulary, common misspellings, acronyms, and service questions.",
)
search_rows = [
    ["Capability", "Implementation and acceptance measure"],
    ["HTML + PDF indexing", "Index published pages and extract searchable text/metadata from supported PDFs; exclude private or unpublished content."],
    ["Single words, multiple words, phrases", "Support broad terms, combined terms, and quoted exact phrases; document expected behavior in help text."],
    ["Typo tolerance", "Return useful best matches for common misspellings while allowing users to view the original query."],
    ["Relevance", "Weight titles, service names, department, metadata, headings, body content, freshness, and curated synonyms."],
    ["Facets", "Filter by pages, documents, meetings, events, notices/news, department, category, and year where appropriate."],
    ["Accessible results", "Keyboard-operable filters, clear result counts, query announcement, highlighted context, and meaningful empty states."],
    ["Search analytics", "Track zero-result and frequently used queries without collecting unnecessary personal information."],
]
story += [styled_table(search_rows, [135, CONTENT_W - 135]), Spacer(1, 14), P("Search engine optimization", "H2Lee")]
story.append(bullet_list([
    "Crawlable, server-delivered or pre-rendered public HTML; XML sitemap; robots controls; canonical URLs; clean redirects.",
    "Unique titles, descriptions, headings, social-sharing metadata, image descriptions, and appropriate structured data.",
    "Descriptive document filenames and metadata, text-based PDFs where available, and accessible alternatives for scanned files.",
    "Fast pages with optimized images, restrained scripts, cache policies, and Core Web Vitals monitoring.",
    "Google Search Console and Bing Webmaster Tools setup, verification, sitemap submission, and launch monitoring.",
]))
story.append(callout(
    "Content quality affects ranking",
    "Technical SEO will be paired with plain-language page titles, clear service descriptions, local terminology, current contact information, and a review schedule so the County's most useful pages remain discoverable.",
    PALE_GOLD,
    GOLD,
))
story += [PageBreak()]

# Migration
story += section(
    "Data and file migration",
    "Preserve the County's investment—and improve it during the move.",
    "Migration will be managed as a countable, reviewable workstream rather than an untracked copy-and-paste exercise.",
)
migration_rows = [
    ["Phase", "Activities", "Evidence delivered"],
    ["1. Inventory", "Crawl public URLs; enumerate pages, files, media, forms, redirects, owners, dates, and known external systems.", "Source inventory + baseline counts"],
    ["2. Decide", "Mark each item keep, revise, merge, archive, link externally, or retire; map it to the new structure and owner.", "Approved content map"],
    ["3. Prepare", "Normalize filenames, dates, titles, categories, document types, alt text, and required metadata; flag scans and duplicates.", "Clean import sheets + exception list"],
    ["4. Import", "Use scripts and structured imports for repeatable content; manually create content where automation would reduce quality.", "Import logs + record counts"],
    ["5. Validate", "Compare source/target counts, sample every content type/year, test files and links, check permissions, and review mobile display.", "Migration QA report"],
    ["6. Redirect", "Map priority and changed URLs to their best new destinations; identify intentional removals and external links.", "301 redirect register"],
    ["7. Freeze & delta", "Agree on a brief content freeze, capture late changes, run final delta import, and obtain County acceptance.", "Final reconciliation + sign-off"],
]
story += [styled_table(migration_rows, [65, 300, 139]), Spacer(1, 13)]
story.append(callout(
    "Archive advantage",
    "The working prototype already organizes 2016–2026 Board of Supervisors records and contains 678 locally staged archive files. That work becomes the foundation for final deduplication, naming cleanup, missing-record review, accessibility triage, and production import.",
))
story += [Spacer(1, 12), P("Migration assumptions", "H2Lee")]
story.append(bullet_list([
    "Base pricing includes migration and validation of up to 750 existing documents/files plus agreed page content in the final site map.",
    "The County supplies administrator access or source exports and identifies authoritative versions where duplicates conflict.",
    "Remediation of complex inaccessible legacy PDFs is prioritized and estimated separately after inventory; simple naming and metadata cleanup is included.",
    "Third-party systems remain linked or embedded unless the final scope explicitly includes an integration or replacement.",
]))
story += [PageBreak()]

# Accessibility, security, performance
story += section(
    "Quality and public trust",
    "Accessibility, security, privacy, and performance are acceptance criteria.",
    "The site will be evaluated through automated checks, keyboard and screen-reader review, representative user tasks, browser/device testing, and documented County acceptance.",
)
quality = [
    ["Area", "Commitment", "Launch evidence"],
    ["Accessibility", "Target WCAG 2.2 Level AA and Section 508-aligned practices: semantic structure, contrast, focus, keyboard access, labels, errors, captions/transcripts planning, reduced motion, zoom/reflow.", "Audit findings, remediation log, manual checklist"],
    ["Responsive/browser", "Current and one prior major version of Chrome, Edge, Firefox, and Safari on representative Windows, macOS, iOS, and Android sizes.", "Browser/device matrix and issue disposition"],
    ["Performance", "Optimized media, caching, code splitting, font strategy, request control, and Core Web Vitals review on representative pages.", "Performance report and documented exceptions"],
    ["Security", "TLS, least privilege, row-level data rules, restricted storage, secure authentication, dependency review, backups, update process, rate/abuse controls where needed.", "Configuration checklist and recovery test"],
    ["Privacy", "Data minimization, private submitter contacts, no public exposure of admin information, cookie-light analytics option, privacy notice support.", "Data-flow review and privacy configuration"],
    ["Content quality", "Broken-link review, spelling and metadata checks, owners/review dates, consistent dates/addresses/phone formats, useful 404 page.", "QA checklist and owner register"],
]
story += [styled_table(quality, [79, 286, 139]), Spacer(1, 13), P("Launch readiness gates", "H2Lee")]
story.append(bullet_list([
    "No unresolved critical security or accessibility defect",
    "County approves navigation, design, priority content, and migrated record counts",
    "Production search indexes all agreed public content and passes agreed query scenarios",
    "Backups, restore/rollback plan, domain/DNS responsibilities, analytics, and monitoring are confirmed",
    "Administrators complete training exercises and receive documentation",
    "Launch communications, freeze window, go/no-go contacts, and rollback decision are documented",
]))
story += [PageBreak()]

# Timeline
story += section(
    "Performance timeline",
    "Ten weeks from notice to proceed to launch.",
    "The schedule assumes timely access to source content, weekly County feedback, and decisions within two business days for milestone approvals. Existing prototype work permits design and migration tasks to overlap.",
)
timeline = [
    ["Timing", "Milestone", "Key work and County checkpoint"],
    ["Week 1", "Kickoff & discovery", "Confirm goals, stakeholders, owners, integrations, metrics, risks, governance, access, and communications."],
    ["Weeks 1–2", "Inventory & information architecture", "Crawl legacy site, baseline content, confirm user tasks, approve new site map and migration decisions."],
    ["Weeks 2–3", "Design validation", "Review prototype, refine responsive components, department templates, accessibility patterns, and visual details."],
    ["Weeks 3–6", "CMS & frontend completion", "Finish content models, permissions, publishing flows, page templates, production search, SEO, and integrations."],
    ["Weeks 4–7", "Migration", "Normalize, import, deduplicate, categorize, link, and validate pages and files; build redirect register."],
    ["Weeks 7–8", "QA & UAT", "Accessibility, device/browser, performance, security, link, forms, search, and staff acceptance testing."],
    ["Week 9", "Training & launch readiness", "Admin training, documentation, final delta migration, DNS/hosting rehearsal, go/no-go review."],
    ["Week 10", "Production launch", "Cutover, smoke testing, indexing checks, monitoring, public handoff, and stabilization begins."],
    ["30 days after", "Stabilization & closeout", "Resolve warranty issues, tune search, review analytics, deliver final artifacts and closeout report."],
]
story += [styled_table(timeline, [65, 130, 309]), Spacer(1, 12)]
story.append(callout(
    "Average turnaround commitment",
    "The projected turnaround is 10 calendar weeks after notice to proceed and receipt of required credentials/content. A compressed schedule may be negotiated after discovery; content-access or approval delays move dependent dates day-for-day.",
    PALE_GOLD,
    GOLD,
))
story += [Spacer(1, 14), P("Project communication", "H2Lee")]
story.append(bullet_list([
    "One accountable project contact and one County product owner",
    "Weekly 30-minute progress review with decisions, risks, upcoming tasks, and demonstration",
    "Shared action/decision log and milestone acceptance checklist",
    "Prompt escalation of content, access, scope, or schedule risks",
]))
story += [PageBreak()]

# Training and support
story += section(
    "Knowledge transfer and support",
    "County staff leave able to operate the site.",
    "Training uses County content and job-based scenarios. Staff will practice the work they actually perform, receive concise references, and retain a sandbox or staging environment for safe rehearsal.",
)
training_rows = [
    ["Audience", "Session", "Topics and deliverables"],
    ["Content contributors", "90 minutes", "Edit pages, links, contacts, accessibility basics, images, documents, previews, drafts, and review dates."],
    ["Publishers/department leads", "90 minutes", "Approve and publish, schedule/expire notices, manage department content, quality checks, and corrections."],
    ["Clerk/records staff", "90 minutes", "Post meetings, agendas, minutes, and audio; use naming/metadata standards; replace or correct a record."],
    ["Calendar moderators", "60 minutes", "Review public submissions, validate contacts/details, approve/reject/edit, publish, and manage CSV uploads."],
    ["Site administrators", "2 hours", "Users/roles, content types, storage, backups, analytics, incident escalation, configuration boundaries, and vendor support."],
]
story += [styled_table(training_rows, [105, 72, 327]), Spacer(1, 12)]
story.append(bullet_list([
    "Live remote sessions for up to 12 staff members; recordings supplied for internal use",
    "Administrator handbook, quick-reference sheets, publishing checklist, and content style guide",
    "One follow-up office-hour session during the 30-day stabilization period",
    "Help requests acknowledged within one business day during implementation and stabilization",
]))
story += [Spacer(1, 9), P("Ongoing service options", "H2Lee")]
support = [
    ["Service", "Included response", "Monthly price"],
    ["Essential care", "Up to 3 hours; routine updates, dependency review, uptime/backup check; 2-business-day response", "$275"],
    ["Standard support", "Up to 8 hours; content/development help, monthly report, accessibility/search review; 1-business-day response", "$625"],
    ["Priority partnership", "Up to 16 hours; priority queue, quarterly roadmap, staff office hour; 4-business-hour response", "$1,200"],
    ["As-needed support", "Scheduled development, training, or content assistance without retainer", "$110/hour"],
]
story += [styled_table(support, [112, 304, 88]), Spacer(1, 10)]
story.append(P("Emergency response and after-hours work are subject to availability and quoted at $150/hour. Service-level terms, rollover, exclusions, and escalation contacts will be stated in the final agreement." , "Tiny"))
story += [PageBreak()]

# Qualifications
story += section(
    "Qualifications and project team",
    "One accountable lead from discovery through training.",
    "Dylan Smith will serve as project manager, user-experience designer, frontend/backend developer, migration lead, quality coordinator, trainer, and primary support contact.",
)
profile = [
    ["Responsibility", "Relevant capability and demonstrated evidence"],
    ["Project management", "Milestone planning, requirement tracking, decision logs, weekly demonstrations, scope/risk reporting, and acceptance checklists."],
    ["Design and frontend", "Responsive React/Vite interface, county-specific visual system, semantic components, navigation, search entry, templates, and administrative forms."],
    ["Data and CMS", "Supabase/PostgreSQL content models, authenticated administration, row-level policies, restricted file storage, validation, publishing states, and CSV workflows."],
    ["Migration", "Archive indexing scripts, repeatable import tooling, content normalization, metadata mapping, file organization, reconciliation, and exception reporting."],
    ["Training and support", "Role-based demonstrations, written setup/operations guidance, staff workflow documentation, and post-launch stabilization."],
]
story += [styled_table(profile, [121, CONTENT_W - 121]), Spacer(1, 13)]
story.append(callout(
    "No subcontracting planned",
    "No subcontractor is included in this proposal. If a specialist becomes advisable—for example, professional translation, complex PDF remediation, or penetration testing—no subcontracted work will begin without written County identification and acceptance.",
))
story += [Spacer(1, 14), P("Documented work samples", "H2Lee")]
samples = [
    ["Work sample", "Relevance"],
    ["Lee County working prototype", "County-specific navigation, services, notices, bids, meeting records, document management, calendar submissions/moderation, administrative publishing, and local visual identity."],
    ["Discover Lee VA — discoverleeva.com", "Related community/tourism platform work, including event publishing and CSV intake, business and artisan directory workflows, managed content, and public-facing local information."],
]
story += [styled_table(samples, [145, CONTENT_W - 145]), Spacer(1, 12)]
story.append(callout(
    "Required factual completion",
    "Before the sealed response is delivered, insert the proposer's exact number of years in business, exact years of professional website design/development experience, telephone number, and mailing address. Those facts were not present in the supplied project materials and have not been invented in this proposal.",
    PALE_RED,
    HexColor("#A84B3F"),
))
story += [PageBreak()]

# References disclosure
story += section(
    "References disclosure",
    "A candid exception, paired with stronger project controls.",
    "The RFP requests at least five county/municipality references, preferably including two in Virginia. The proposer does not currently have those government-agency references and does not present unrelated contacts as government clients.",
)
story.append(callout(
    "Requested exception",
    "The proposer respectfully asks Lee County to evaluate the working prototype, technical demonstration, related community platform, milestone-based payment plan, acceptance gates, and warranty as substitute evidence of competence, and—if the County determines it appropriate—to exercise its reserved right to waive this deviation. The proposer understands the County may instead determine that the reference requirement is material and decline the proposal.",
    PALE_GOLD,
    GOLD,
))
story += [Spacer(1, 15), P("Risk-reduction commitments", "H2Lee")]
controls = [
    ["County concern", "Proposed protection"],
    ["Can the proposer deliver the stated user experience?", "County evaluates a working Lee County prototype and receives a staged URL at every major milestone."],
    ["Will the CMS work for staff?", "Staff complete defined publishing tasks in staging before CMS acceptance and related payment."],
    ["Will legacy records be preserved?", "Baseline counts, mapping decisions, import logs, sampling, reconciliation, and County sign-off are required."],
    ["Will the site be usable and accessible?", "Test matrix, accessibility remediation log, search scenarios, browser results, and UAT are acceptance deliverables."],
    ["What happens if progress stops?", "Milestone payments limit County exposure; County receives paid-for deliverables, content, data exports, and current documentation."],
    ["What happens after launch?", "Thirty-day defect stabilization is included, with optional support plans and documented handoff."],
]
story += [styled_table(controls, [155, CONTENT_W - 155]), Spacer(1, 14), P("Permitted substitute references", "H2Lee")]
story.append(P("If the County will accept non-government references, up to five client or professional contacts may be added here after the proposer obtains permission to share their names, organizations, telephone numbers, email addresses, project descriptions, and dates. No contact should be listed without consent."))
placeholder = [
    ["Reference", "Organization / project", "Contact information"],
    ["1", "To be supplied with permission", "Name • title • phone • email"],
    ["2", "To be supplied with permission", "Name • title • phone • email"],
    ["3", "To be supplied with permission", "Name • title • phone • email"],
    ["4", "To be supplied with permission", "Name • title • phone • email"],
    ["5", "To be supplied with permission", "Name • title • phone • email"],
]
story += [styled_table(placeholder, [55, 210, 239]), PageBreak()]

# Pricing
story += section(
    "Cost estimate",
    "A fixed-fee core project with separately priced options.",
    "Final scope will be confirmed with the County. The core estimate includes project management, design validation, development, CMS completion, migration within stated limits, search, SEO, QA, training, launch, and 30-day stabilization.",
)
pricing = [
    ["Core deliverable", "Estimated fee"],
    ["Discovery, requirements, governance, and project management", "$2,250"],
    ["Information architecture and responsive design validation", "$2,750"],
    ["Public frontend and staff CMS completion", "$6,750"],
    ["Content/file migration, metadata, QA, and redirects (up to 750 files)", "$4,750"],
    ["Production site search and technical SEO", "$3,250"],
    ["Accessibility, browser/device, performance, and security QA", "$2,250"],
    ["Training, launch, documentation, and 30-day stabilization", "$1,750"],
    [P("TOTAL ESTIMATED FIXED FEE", "TableCellBold"), P("$23,750", "TableCellBold")],
]
price_table = styled_table(pricing, [CONTENT_W - 96, 96])
price_table.setStyle(TableStyle([
    ("BACKGROUND", (0, -1), (-1, -1), PALE_GOLD),
    ("LINEABOVE", (0, -1), (-1, -1), 1.2, GOLD),
    ("TOPPADDING", (0, -1), (-1, -1), 9),
    ("BOTTOMPADDING", (0, -1), (-1, -1), 9),
]))
story += [price_table, Spacer(1, 13), P("Proposed milestone payment schedule", "H2Lee")]
payments = [
    ["Milestone", "Percent", "Amount"],
    ["Contract / notice to proceed; kickoff and access checklist", "15%", "$3,562.50"],
    ["Information architecture and design acceptance", "20%", "$4,750.00"],
    ["Functional staging beta: CMS, templates, and search", "30%", "$7,125.00"],
    ["Migration, QA, training, and launch-readiness acceptance", "20%", "$4,750.00"],
    ["Production launch and start of 30-day stabilization", "15%", "$3,562.50"],
]
story += [styled_table(payments, [320, 76, 108]), Spacer(1, 12)]
story.append(P("Invoices are due Net 15 unless the County's standard payment terms require otherwise. No interest, late fee, or reimbursable travel cost is included without a final written agreement. Material scope changes require a written change request stating cost and schedule impact before work begins.", "BodySmall"))
story += [PageBreak()]

# Options
story += section(
    "Optional products and services",
    "Useful additions the County may accept now or later.",
    "Options are independent of the core project unless selected in writing. Third-party fees and final requirements may affect quoted amounts.",
)
options = [
    ["Optional service", "Estimated cost"],
    ["Managed production hosting, SSL, backups, uptime monitoring, and routine platform oversight", "$95/month ($1,140/year)"],
    ["Accessibility monitoring dashboard and quarterly issue review", "$900/year"],
    ["Analytics/search-insight dashboard with quarterly summary", "$1,200 setup"],
    ["Emergency banner and department-level alert workflow", "$850"],
    ["Email subscription / notice digest integration", "$1,500 + provider fees"],
    ["SMS alerts integration", "$1,800 + messaging fees"],
    ["Online service-request intake with routing and status notifications", "From $2,750"],
    ["Multilingual framework and priority-page publishing workflow", "$1,800 + translation"],
    ["Additional legacy file migration above included 750", "$3/file; minimum $300"],
    ["Simple page copyediting / plain-language rewrite", "$90/page"],
    ["Complex legacy PDF accessibility remediation", "After inventory; from $65/file"],
    ["Additional onsite or remote training", "$110/hour + approved travel"],
    ["Independent penetration test coordination", "Third-party quote + coordination"],
]
story += [styled_table(options, [350, 154]), Spacer(1, 13), P("Recommended future roadmap", "H2Lee")]
story.append(bullet_list([
    "Phase 2: searchable staff directory, online service request routing, and emergency banner controls",
    "Phase 2: email/SMS subscriptions for notices, bids, meetings, and calendar categories",
    "Phase 3: priority form digitization, payment/integration review, and GIS or property-data connections",
    "Ongoing: quarterly accessibility, search, content-freshness, and analytics reviews",
]))
story.append(callout(
    "Avoid unnecessary subscriptions",
    "The final architecture will favor portable data, open web standards, and the smallest practical set of paid services. Any recurring platform or search license will be identified for County approval before commitment.",
))
story += [PageBreak()]

# Terms
story += section(
    "Assumptions, ownership, and commitments",
    "Clear boundaries protect the County and the schedule.",
)
terms = [
    ["Topic", "Proposed term"],
    ["County responsibilities", "Designate a product owner; provide timely content/access; identify authoritative records; coordinate department review; make decisions; review milestones; control domain/DNS and legal policy content."],
    ["Included revisions", "Two consolidated review rounds for site architecture/design and one consolidated review round per major template before acceptance. Defects and missed requirements are corrected without consuming revisions."],
    ["Ownership", "Upon full payment, the County owns its content, uploaded files, structured data, approved custom design artifacts, and custom project code, subject to third-party open-source licenses. Proposer retains pre-existing general tools and know-how."],
    ["Credentials and portability", "Production service accounts should be County-owned wherever practical. Credentials are transferred through an agreed secure method; data exports and current documentation are supplied at closeout."],
    ["Warranty", "For 30 calendar days after launch, the proposer will correct reproducible defects that cause accepted requirements to fail, at no additional professional-services charge."],
    ["Third-party services", "Licenses, transaction fees, domain costs, translation, professional photography, complex document remediation, and integrations not listed in the core estimate require County approval."],
    ["Records and legal review", "County determines Virginia public-records, retention, privacy, open-meetings, procurement, and legal-policy requirements. The proposer configures agreed technical controls but does not provide legal advice."],
    ["Subcontracting", "None planned. Any future subcontractor must be identified and accepted in writing by the County before performing work."],
    ["Non-discrimination", "By signing and submitting, the proposer covenants not to discriminate in employment on the bases stated in the RFP, including race, color, religion, national origin, age, sex, marital status, or unrelated disability."],
]
story += [styled_table(terms, [116, CONTENT_W - 116]), Spacer(1, 12)]
story.append(P("This proposal is an offer to negotiate a final scope and agreement; it does not override the RFP or the County's lawful terms. If a conflict exists, the executed agreement and incorporated procurement documents control.", "BodySmall"))
story += [PageBreak()]

# Submission checklist and signature
story += section(
    "Submission and acceptance",
    "Final assembly checklist for the sealed response.",
    "The RFP requires physical delivery. Email or fax submission is not accepted, and a postmark does not satisfy the deadline.",
)
checklist = [
    ["Complete", "Required action"],
    ["☐", "Insert exact years in business and years of professional web design/development experience."],
    ["☐", "Insert proposer telephone number and mailing address."],
    ["☐", "Add permitted non-government references if available, or leave the candid exception disclosure unchanged."],
    ["☐", "Review and approve the proposed $23,750 cost, options, payment milestones, and 10-week schedule."],
    ["☐", "Sign the certification below; add any required W-9, business license, insurance, or vendor forms requested by the County."],
    ["☐", "Print three complete hard copies and place one complete PDF electronic copy on a CD or flash drive."],
    ["☐", "Seal all copies in one envelope/package marked with proposer name and “Proposal for Website Redesign Services.”"],
    ["☐", "Deliver no later than 2:00 p.m. ET, Thursday, October 15, 2026. Do not rely on a postmark."],
]
story += [styled_table(checklist, [53, CONTENT_W - 53]), Spacer(1, 15), P("Delivery address", "H2Lee")]
addresses = Table([
    [P("BY MAIL", "TableHead"), P("IN PERSON", "TableHead")],
    [P("Clint Carter, County Administrator<br/>P.O. Box 367<br/>Jonesville, Virginia 24263", "BodySmall"),
     P("Clint Carter, County Administrator<br/>Lee County Courthouse<br/>33640 Main Street, Room 111<br/>Jonesville, Virginia 24263", "BodySmall")],
], colWidths=[CONTENT_W / 2] * 2)
addresses.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), FOREST),
    ("BACKGROUND", (0, 1), (-1, 1), PALE_GREEN),
    ("GRID", (0, 0), (-1, -1), 0.6, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story += [addresses, Spacer(1, 14)]
story.append(callout(
    "Question deadline",
    "Questions about the RFP must be directed to Clint Carter at ccarter@leecova.org no later than October 9, 2026. A prudent question is whether the County will accept substitute non-government references and the working prototype in place of five county/municipal references.",
    PALE_GOLD,
    GOLD,
))
story += [PageBreak()]

story += section(
    "Certification",
    "Proposer acknowledgment and signature.",
    "The undersigned certifies that the information in this proposal is accurate to the best of the proposer's knowledge, acknowledges the disclosed reference exception, agrees to the RFP non-discrimination covenant, and is authorized to negotiate the proposed services.",
)
cert = Table([
    [P("PROPOSER", "TableCellBold"), P("Dylan Smith, Independent Web Developer", "TableCell")],
    [P("EMAIL", "TableCellBold"), P("dylanjsmith.dev@gmail.com", "TableCell")],
    [P("TELEPHONE", "TableCellBold"), P("____________________________________________", "TableCell")],
    [P("MAILING ADDRESS", "TableCellBold"), P("____________________________________________<br/>____________________________________________", "TableCell")],
    [P("SIGNATURE", "TableCellBold"), P("<br/>____________________________________________", "TableCell")],
    [P("DATE", "TableCellBold"), P("____________________________________________", "TableCell")],
], colWidths=[120, CONTENT_W - 120])
cert.setStyle(TableStyle([
    ("GRID", (0, 0), (-1, -1), 0.6, LINE),
    ("BACKGROUND", (0, 0), (0, -1), PALE_GREEN),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
]))
story += [cert, Spacer(1, 22)]
story.append(P("Built around Lee County's information. Structured for the County's staff. Designed to make public service easier to find.", "Quote"))
story += [Spacer(1, 26), HRFlowable(width="100%", thickness=1.2, color=GOLD), Spacer(1, 12)]
story.append(P("END OF PROPOSAL • LC-WEB-2026-01", "Eyebrow"))


doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_header_footer)
print(OUTPUT)

