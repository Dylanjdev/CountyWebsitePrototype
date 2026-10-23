import { useEffect, useState } from 'react'
import countyLogo from './assets/lee-logo.avif'
import heroImage from './assets/lee-county-hero.webp'
import { historicalMeetingDocuments } from './data/historicalMeetings'
import { DOCUMENT_BUCKET, isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

const PUBLIC_RECORD_RETENTION_YEARS = 3
const SITE_BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, '')

function sitePath(value) {
  if (!value?.startsWith('/') || value.startsWith('//')) return value
  return `${SITE_BASE_PATH}${value}` || '/'
}

function routePath(pathname) {
  const relativePath = SITE_BASE_PATH && (pathname === SITE_BASE_PATH || pathname.startsWith(`${SITE_BASE_PATH}/`))
    ? pathname.slice(SITE_BASE_PATH.length)
    : pathname
  return relativePath.replace(/\/+$/, '') || '/'
}

const quickLinks = [
  { icon: 'notice', title: 'Public Notices', description: 'Official notices, announcements, hearings, and important information.', href: '/public-notices' },
  { icon: 'meeting', title: 'Meetings & Agendas', description: 'Upcoming meetings, agendas, minutes, and public body information.', href: '/meeting-minutes' },
  { icon: 'calendar', title: 'County Calendar', description: 'Government meetings, community events, deadlines, and important dates.', href: '/calendar' },
  { icon: 'briefcase', title: 'Bid Notices', description: 'Current bids, requests for proposals, and procurement opportunities.', href: '/bid-notices' },
]

const services = [
  { icon: 'building', title: 'County Administration', text: 'County government operations, administration, and services.', href: '/county-administration' },
  { icon: 'inspection', title: 'Building & Inspections', text: 'Permits, inspections, building requirements, and development.' },
  { icon: 'zoning', title: 'Zoning', text: 'Zoning information, applications, regulations, and resources.' },
  { icon: 'map', title: 'Mapping & GIS', text: 'Property information, geographic data, maps, and GIS resources.' },
  { icon: 'recycle', title: 'Litter Control & Recycling', text: 'Waste reduction, recycling, and community cleanup resources.' },
  { icon: 'departments', title: 'County Departments', text: 'Contact information and services for county offices and departments.' },
]

const governmentLinks = [
  { icon: 'people', title: 'Board of Supervisors', text: 'Meeting schedules, agendas, minutes, and county decisions.', href: '/elected-officials' },
  { icon: 'building', title: 'County Administration', text: 'Connect with the County Administrator and county operations.', href: '/county-administration' },
  { icon: 'columns', title: 'Constitutional Offices', text: "Lee County's constitutional officers and their services.", href: '/elected-officials' },
  { icon: 'scales', title: 'Courts', text: 'Information and resources for court services serving Lee County.', href: '/courts' },
]

const countyAdministrationResponsibilities = [
  { icon: 'building', title: 'County operations', text: 'Direct the day-to-day work of county government and coordinate the delivery of public services.' },
  { icon: 'people', title: 'Staff leadership', text: 'Supervise county staff and support departments in carrying out their responsibilities to the community.' },
  { icon: 'form', title: 'Board policy', text: 'Implement policies and priorities established by the Board of Supervisors and serve as Clerk to the Board.' },
  { icon: 'link', title: 'Agency coordination', text: 'Work with local, regional, and state partners to connect Lee County residents with effective services.' },
]

const countyAdministrationResources = [
  { icon: 'people', title: 'Board of Supervisors', text: 'County leadership, public meetings, and Board information.', href: '/elected-officials' },
  { icon: 'meeting', title: 'Meetings & agendas', text: 'Browse agendas, minutes, and available audio recordings.', href: '/meeting-minutes' },
  { icon: 'notice', title: 'Public notices', text: 'Read current official notices and opportunities for public input.', href: '/public-notices' },
  { icon: 'budget', title: 'County budgets', text: 'Access published county budgets and financial documents.', href: '/county-budgets' },
  { icon: 'form', title: 'County documents', text: 'Search forms, reports, policies, and public records.', href: '/documents' },
  { icon: 'map', title: 'Mapping & GIS', text: 'Open Lee County mapping and geographic information resources.', href: 'https://www.leecova.com/mapping-gis', external: true },
  { icon: 'code', title: 'Lee County Code', text: 'Review county ordinances in the online code library.', href: 'https://codelibrary.amlegal.com/codes/leecountyva/latest/overview', external: true },
  { icon: 'employment', title: 'Employment', text: 'Find county departments and employment information.', href: '/departments' },
]

const businessLinks = [
  'Business & Economic Development',
  'Planning, Zoning & Development',
  'County Bids & Procurement',
  'Property & GIS Information',
  'Employment Opportunities',
]

const resourceLinks = [
  { icon: 'resources', title: 'Resources', text: 'Helpful county and community resources.' },
  { icon: 'link', title: 'County Links', text: 'Local, regional, state, and community organizations.' },
  { icon: 'employment', title: 'Employment', text: 'Employment opportunities with Lee County.' },
  { icon: 'form', title: 'Employee Forms', text: 'Forms and resources for county employees.' },
  { icon: 'payment', title: 'Payments', text: 'Online payment resources for county services.' },
]

const publicInfoLinks = [
  { icon: 'property', title: 'Property Cards', text: 'View available property card information.' },
  { icon: 'map', title: 'Mapping & GIS', text: 'Explore county maps and geographic information.' },
  { icon: 'budget', title: 'County Budget', text: 'Review county budgets and financial documents.', href: '/county-budgets' },
  { icon: 'audit', title: 'County Audits', text: 'Access audit reports and financial information.' },
  { icon: 'disbursement', title: 'Disbursements', text: 'View county financial disbursement information.' },
  { icon: 'code', title: 'Lee County Code', text: 'Access local ordinances and the Code of Lee County.' },
]

const updates = [
  { label: 'Public notice', date: 'County information', title: 'Official announcements, notices, and public information', icon: 'notice', href: '/public-notices' },
  { label: 'County meetings', date: 'Agendas & minutes', title: 'Find upcoming meetings and public meeting records', icon: 'meeting', href: '/meeting-minutes' },
  { label: 'Events calendar', date: 'Dates & deadlines', title: 'See community events and important county dates', icon: 'calendar', href: '/calendar' },
]

const publicNoticeResources = [
  {
    icon: 'code',
    title: 'County Ordinances',
    text: 'Search and review the current Code of Lee County, Virginia.',
    href: 'https://codelibrary.amlegal.com/codes/leecountyva/latest/overview',
    label: 'View county code',
  },
  {
    icon: 'map',
    title: '2025 Comprehensive Plan',
    text: 'Read Lee County’s long-range guide for growth, land use, and community development.',
    href: 'https://www.leecova.com/_files/ugd/0394e7_d621df55224d457c8cbbf777512923a0.pdf',
    label: 'Open plan (PDF)',
  },
]

const fallbackPublicNotices = [
  {
    id: 'website-rfp',
    slug: 'website-redesign-and-development',
    icon: 'briefcase',
    notice_type: 'Request for proposals',
    posted_at: '2026-09-21',
    title: 'Website Redesign and Development',
    summary: 'The County of Lee, Virginia is soliciting proposals from qualified firms or individuals to provide website redesign and development services.',
    body: 'Firms or individuals submitting proposals must meet the minimum qualifications and criteria described in the full request. Selection will be based on the proposal that best meets the needs of the county. Price will be considered, but will not be the sole determining factor.',
    deadline_at: '2026-10-15T14:00:00',
    contact_name: 'Jerrica Eldridge-Carter, Purchasing Clerk',
    contact_phone: '(276) 346-7714',
    action_url: 'https://www.leecova.com/_files/ugd/0394e7_3ccd9a52796544be9420115969ace47c.pdf',
    action_label: 'View full RFP (PDF)',
    is_featured: true,
    status: 'published',
  },
  {
    id: 'roadway-safety-survey',
    slug: 'virginia-2026-roadway-safety-survey',
    icon: 'road',
    notice_type: 'Public input requested',
    title: 'Virginia 2026 Roadway Safety Survey',
    summary: 'The Virginia Department of Transportation and the Virginia Strategic Highway Safety Plan Steering Committee are seeking public input to help update Virginia’s 2027–2031 Strategic Highway Safety Plan.',
    body: 'Residents are encouraged to complete and share the survey so the plan reflects a broad and diverse group of Virginians.',
    action_url: 'https://publicinput.com/i31756',
    action_label: 'Take the survey',
    created_at: '2026-09-23T00:00:00',
    status: 'published',
  },
  {
    id: 'well-services',
    slug: 'well-repair-and-maintenance',
    icon: 'water',
    notice_type: 'As-needed services',
    title: 'Well Repair and Maintenance',
    summary: 'Lee County is seeking as-needed services for residential wells located near the Lee County Transfer Station in Jonesville, Virginia.',
    body: 'Services may include pump repair or replacement and other well maintenance. Qualified and interested entities may submit a statement to the Lee County Administrator’s Office, Room 111, Lee County Courthouse, P.O. Box 367, Jonesville, VA 24263.',
    contact_name: 'Clint Carter, County Administrator',
    contact_phone: '(276) 346-7714',
    created_at: '2026-09-23T00:00:00',
    status: 'published',
  },
  {
    id: 'second-amendment-statement',
    slug: 'second-amendment-commitment',
    icon: 'shield',
    notice_type: 'Board statement',
    title: 'Commitment to the Second Amendment',
    summary: 'The Lee County Board of Supervisors affirms its strong commitment to the Second Amendment and to the citizens of Lee County.',
    body: '',
    created_at: '2026-09-23T00:00:00',
    status: 'published',
  },
]

const noticeTypes = [
  'Public notice',
  'Request for proposals',
  'Public input requested',
  'As-needed services',
  'Public hearing',
  'Board statement',
]

const meetingTypes = [
  'Regular Meeting',
  'Recessed Meeting',
  'Special Called Meeting',
  'Annual Meeting',
  'Organizational Meeting',
  'Public Hearing',
  'Work Session',
  'Other',
]

const EVENT_CATEGORIES = [
  'Community',
  'Festival',
  'Live Music',
  'Arts & Culture',
  'Outdoors',
  'Family',
  'Government',
  'Other',
]

const EVENT_CSV_COLUMNS = ['title', 'category', 'start_date', 'start_time', 'end_date', 'end_time', 'all_day', 'venue', 'address', 'website', 'description']
const EVENT_CSV_MAX_EVENTS = 100
const EVENT_CSV_MAX_BYTES = 2 * 1024 * 1024
const EVENT_CSV_HEADERS = {
  title: 'title',
  event_title: 'title',
  category: 'category',
  start_date: 'startDate',
  start_time: 'startTime',
  end_date: 'endDate',
  end_time: 'endTime',
  all_day: 'allDay',
  allday: 'allDay',
  venue: 'locationName',
  location: 'locationName',
  location_name: 'locationName',
  address: 'address',
  street_address: 'address',
  website: 'websiteUrl',
  website_url: 'websiteUrl',
  url: 'websiteUrl',
  description: 'description',
}

const meetingYears = Array.from({ length: PUBLIC_RECORD_RETENTION_YEARS + 1 }, (_, index) => new Date().getFullYear() - index)

const meetingArchiveBaseUrl = import.meta.env.VITE_MEETING_ARCHIVE_BASE_URL?.trim().replace(/\/$/, '') || ''

function encodeArchivePath(value) {
  return value.split('/').map((segment) => encodeURIComponent(segment)).join('/')
}

function historicalMeetingUrl(document) {
  if (!document.archive_path) return document.external_url || ''
  const archivePath = encodeArchivePath(document.archive_path)
  if (meetingArchiveBaseUrl) return `${meetingArchiveBaseUrl}/${archivePath}`
  return document.external_url || ''
}

function meetingDocumentIdentity(document) {
  const type = document.meeting_type?.toLowerCase().replace(/\s+part\s+\d+$/i, '').replace(/secondary system six-year plan|ssyp/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  return `${document.meeting_date}|${type}|${document.document_type}|${document.part || ''}`
}

function parseCsvRows(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') quoted = false
      else field += character
    } else if (character === '"' && field.length === 0) quoted = true
    else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n' || character === '\r') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      if (character === '\r' && text[index + 1] === '\n') index += 1
    } else field += character
  }

  if (quoted) throw new Error('The CSV has an unclosed quoted field.')
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function normalizeCsvHeader(value) {
  return value.replace(/^\ufeff/, '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function parseEventDate(value, label, required = false) {
  const input = value.trim()
  if (!input) {
    if (required) throw new Error(`${label} is required.`)
    return ''
  }

  const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  const usMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  let year
  let month
  let day
  if (isoMatch) [, year, month, day] = isoMatch.map(Number)
  else if (usMatch) [, month, day, year] = usMatch.map(Number)
  else throw new Error(`${label} must use YYYY-MM-DD or M/D/YYYY.`)

  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error(`${label} is not a valid date.`)
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseEventTime(value, label, required = false) {
  const input = value.trim()
  if (!input) {
    if (required) throw new Error(`${label} is required unless the event is all day.`)
    return ''
  }

  const match = input.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?$/i)
  if (!match) throw new Error(`${label} must use a time such as 18:30 or 6:30 PM.`)
  let hour = Number(match[1])
  const minute = Number(match[2] ?? 0)
  const meridiem = match[3]?.toLowerCase().replaceAll('.', '')
  if (minute > 59) throw new Error(`${label} is not a valid time.`)
  if (meridiem) {
    if (hour < 1 || hour > 12) throw new Error(`${label} is not a valid time.`)
    if (hour === 12) hour = 0
    if (meridiem === 'pm') hour += 12
  } else if (hour > 23) throw new Error(`${label} is not a valid time.`)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function parseAllDay(value) {
  const normalized = value.trim().toLowerCase()
  if (!normalized || ['no', 'false', '0', 'n'].includes(normalized)) return false
  if (['yes', 'true', '1', 'y'].includes(normalized)) return true
  throw new Error('All day must be Yes or No.')
}

function normalizeEventCategory(value) {
  if (!value.trim()) return 'Community'
  const normalized = value.trim().toLowerCase().replaceAll('&', 'and').replace(/\s+/g, ' ')
  const category = EVENT_CATEGORIES.find((item) => item.toLowerCase().replaceAll('&', 'and') === normalized)
  if (!category) throw new Error(`Category must be one of: ${EVENT_CATEGORIES.join(', ')}.`)
  return category
}

function easternDateTimeToIso(date, time = '00:00') {
  const initial = new Date(`${date}T${time}:00.000Z`)
  const getOffset = (value) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(value)
    const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]))
    return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)) - value.getTime()
  }
  let result = new Date(initial.getTime() - getOffset(initial))
  result = new Date(initial.getTime() - getOffset(result))
  return result.toISOString()
}

function normalizeEventWebsite(value) {
  const input = value.trim()
  if (!input) return null
  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`
  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    if (url.href.length > 500) throw new Error('Event website must be 500 characters or fewer.')
    return url.href
  } catch (error) {
    if (error.message?.includes('500 characters')) throw error
    throw new Error('Enter a valid event website.', { cause: error })
  }
}

function prepareEventPayload(event) {
  const title = event.title.trim()
  const description = event.description.trim()
  const locationName = event.locationName.trim()
  const address = event.address.trim()
  if (!title) throw new Error('Event title is required.')
  if (title.length > 120) throw new Error('Event title must be 120 characters or fewer.')
  if (description.length > 4000) throw new Error('Description must be 4,000 characters or fewer.')
  if (locationName.length > 160) throw new Error('Venue must be 160 characters or fewer.')
  if (address.length > 240) throw new Error('Address must be 240 characters or fewer.')
  if (!event.allDay && !event.startTime) throw new Error('Enter an event start time.')
  if (!event.allDay && Boolean(event.endDate) !== Boolean(event.endTime)) {
    throw new Error('Enter both an end date and end time, or leave both blank.')
  }

  const startAt = easternDateTimeToIso(event.startDate, event.allDay ? '00:00' : event.startTime)
  let endAt = null
  if (event.allDay && event.endDate) endAt = easternDateTimeToIso(event.endDate, '23:59')
  else if (!event.allDay && event.endDate && event.endTime) endAt = easternDateTimeToIso(event.endDate, event.endTime)
  if (endAt && new Date(endAt) <= new Date(startAt)) throw new Error('The event end must be after its start.')

  return {
    title,
    description: description || null,
    startAt,
    endAt,
    allDay: event.allDay,
    locationName: locationName || null,
    address: address || null,
    websiteUrl: normalizeEventWebsite(event.websiteUrl),
    category: normalizeEventCategory(event.category),
  }
}

function parseEventCsv(text) {
  let rows
  try {
    rows = parseCsvRows(text)
  } catch (error) {
    return { events: [], errors: [error.message] }
  }

  const populatedRows = rows.filter((row) => row.some((field) => field.trim()))
  if (populatedRows.length === 0) return { events: [], errors: ['The CSV file is empty.'] }
  const headers = populatedRows[0].map((header) => EVENT_CSV_HEADERS[normalizeCsvHeader(header)] ?? null)
  const errors = []
  for (const required of ['title', 'startDate']) {
    if (!headers.includes(required)) errors.push(`Missing required “${required === 'startDate' ? 'start_date' : required}” column.`)
  }
  const duplicates = headers.filter((header, index) => header && headers.indexOf(header) !== index)
  if (duplicates.length > 0) errors.push(`Duplicate column: ${[...new Set(duplicates)].join(', ')}.`)

  const dataRows = populatedRows.slice(1)
  if (dataRows.length === 0) errors.push('The CSV does not contain any event rows.')
  if (dataRows.length > EVENT_CSV_MAX_EVENTS) errors.push(`The CSV has ${dataRows.length} events; the maximum is ${EVENT_CSV_MAX_EVENTS}.`)
  if (errors.length > 0) return { events: [], errors }

  const events = []
  dataRows.slice(0, EVENT_CSV_MAX_EVENTS).forEach((row, index) => {
    const values = {}
    headers.forEach((header, columnIndex) => {
      if (header) values[header] = row[columnIndex]?.trim() ?? ''
    })
    const csvRow = index + 2
    try {
      const allDay = parseAllDay(values.allDay ?? '')
      const startDate = parseEventDate(values.startDate ?? '', 'Start date', true)
      const startTime = parseEventTime(values.startTime ?? '', 'Start time', !allDay)
      let endDate = parseEventDate(values.endDate ?? '', 'End date')
      const endTime = parseEventTime(values.endTime ?? '', 'End time')
      if (!endDate && endTime) endDate = startDate
      const event = {
        csvRow,
        title: values.title ?? '',
        category: normalizeEventCategory(values.category ?? ''),
        description: values.description ?? '',
        startDate,
        startTime,
        endDate,
        endTime,
        allDay,
        locationName: values.locationName ?? '',
        address: values.address ?? '',
        websiteUrl: values.websiteUrl ?? '',
      }
      events.push({ ...event, payload: prepareEventPayload(event) })
    } catch (error) {
      errors.push(`Row ${csvRow}: ${error.message}`)
    }
  })
  return { events, errors }
}

const staticMeetingDocuments = historicalMeetingDocuments
  .filter((document) => document.meeting_date >= getPublicRecordRetentionCutoff())
  .map((document) => ({
    ...document,
    download_url: historicalMeetingUrl(document),
  }))

const emptyNoticeForm = () => ({
  title: '',
  notice_type: 'Public notice',
  posted_at: new Date().toISOString().slice(0, 10),
  summary: '',
  body: '',
  deadline_at: '',
  expires_at: '',
  contact_name: '',
  contact_phone: '',
  submission_address: '',
  action_url: '',
  action_label: '',
  is_featured: false,
  status: 'draft',
})

const emptyMeetingForm = () => ({
  title: '',
  meeting_date: new Date().toISOString().slice(0, 10),
  meeting_type: 'Regular Meeting',
  document_type: 'Agenda',
  is_published: true,
})

const emptyAdminEventForm = () => ({
  title: '',
  category: 'Community',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  allDay: false,
  locationName: '',
  address: '',
  websiteUrl: '',
  status: 'pending',
  isPublished: false,
})

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'County Departments', href: '/departments' },
  { label: 'Media', href: '/media' },
  { label: 'Elected Officials', href: '/elected-officials' },
  { label: 'Courts', href: '/courts' },
  { label: 'Airport', href: '/airport' },
]

const interiorPages = {
  '/about': {
    navTitle: 'About',
    eyebrow: 'About Lee County',
    title: 'Where Virginia Begins',
    intro: 'Discover the communities, government, natural resources, and opportunities that make Lee County a unique part of Southwest Virginia.',
    heading: 'A county grounded in place and community',
    overview: 'From our mountain landscape and historic communities to the people and businesses that call Lee County home, our county is built on a strong sense of place. This site connects residents, visitors, and businesses with county government and community resources.',
    cards: [
      { icon: 'building', title: 'County Government', text: 'Learn how Lee County government serves residents and supports our communities.' },
      { icon: 'resources', title: 'Community Resources', text: 'Find helpful information and connections for residents and visitors.' },
      { icon: 'briefcase', title: 'Business & Development', text: 'Explore resources for businesses, property development, and investment.' },
      { icon: 'map', title: 'Tourism & Outdoors', text: 'Discover the places, landscapes, and experiences found across Lee County.' },
    ],
  },
  '/departments': {
    navTitle: 'County Departments',
    eyebrow: 'Lee County Government',
    title: 'County Departments',
    intro: 'Find the offices, programs, and public services provided by Lee County government.',
    heading: 'County services, organized around you',
    overview: 'Use this directory to locate county departments and the information you need. Each department connects residents, property owners, businesses, and visitors with essential public services.',
    cards: services,
  },
  '/county-administration': {
    kind: 'county-administration',
    navTitle: 'County Administration',
    eyebrow: 'Lee County Government',
    title: 'County Administration',
    intro: 'Learn about the office responsible for county operations, Board policy implementation, staff leadership, and coordination of public services.',
  },
  '/media': {
    navTitle: 'Media',
    eyebrow: 'News & Public Information',
    title: 'Media Center',
    intro: 'Stay informed with official notices, county meetings, announcements, calendars, and other public information.',
    heading: 'The latest from Lee County',
    overview: 'The media center brings together official county communications and timely public information. Check notices, meeting materials, important dates, and county updates in one place.',
    cards: [
      { icon: 'notice', title: 'Public Notices', text: 'Official notices, announcements, hearings, and public information.', href: '/public-notices' },
      { icon: 'meeting', title: 'Meetings & Agendas', text: 'Upcoming meetings, agendas, minutes, and public body information.', href: '/meeting-minutes' },
      { icon: 'calendar', title: 'County Calendar', text: 'Government meetings, community events, deadlines, and important dates.', href: '/calendar' },
      { icon: 'briefcase', title: 'Bid Notices', text: 'Current county bids, requests for proposals, and procurement opportunities.', href: '/bid-notices' },
      { icon: 'resources', title: 'News & Updates', text: 'County announcements, projects, and community information.' },
    ],
  },
  '/elected-officials': {
    navTitle: 'Elected Officials',
    eyebrow: 'Lee County Government',
    title: 'Elected Officials',
    intro: 'Connect with the public officials and constitutional offices serving the people of Lee County.',
    heading: 'Public service and accountable government',
    overview: 'Lee County’s elected leadership and constitutional offices carry out the public responsibilities of local government. Find meeting information, office resources, and ways to stay connected with county decisions.',
    cards: [
      { icon: 'people', title: 'Board of Supervisors', text: 'Meeting schedules, agendas, minutes, and county decisions.' },
      { icon: 'columns', title: 'Constitutional Offices', text: 'Information about Lee County’s constitutional officers and their services.' },
      { icon: 'building', title: 'County Administration', text: 'Connect with county administration and learn about county operations.', href: '/county-administration' },
      { icon: 'meeting', title: 'Public Meetings', text: 'Find upcoming meetings and access available public meeting records.' },
    ],
  },
  '/courts': {
    navTitle: 'Courts',
    eyebrow: 'Court Resources',
    title: 'Lee County Courts',
    intro: 'Find information and public resources for court services serving Lee County.',
    heading: 'Court information in one place',
    overview: 'Use these resources to locate court information, understand available services, and connect with the appropriate office. Specific case, filing, and schedule information should be confirmed with the relevant court.',
    cards: [
      { icon: 'scales', title: 'Court Information', text: 'General information about the courts serving Lee County.' },
      { icon: 'columns', title: 'Court Services', text: 'Find the appropriate court office and available public services.' },
      { icon: 'form', title: 'Records & Forms', text: 'Access available court record and form resources.' },
      { icon: 'calendar', title: 'Schedules & Calendars', text: 'Connect with official sources for current court schedules.' },
    ],
  },
  '/airport': {
    navTitle: 'Airport',
    eyebrow: 'Community & Economic Development',
    title: 'Lee County Airport',
    intro: 'Learn about the Lee County Airport and the aviation resources available to our community.',
    heading: 'Connecting Lee County to opportunity',
    overview: 'The Lee County Airport is part of the county’s wider community and economic development network. Find general airport information and connections to business, tourism, and regional resources.',
    cards: [
      { icon: 'map', title: 'Airport Information', text: 'General information and resources for the Lee County Airport.' },
      { icon: 'resources', title: 'Aviation Resources', text: 'Connect with aviation information available in the community.' },
      { icon: 'briefcase', title: 'Business & Development', text: 'Explore business and economic development resources in Lee County.' },
      { icon: 'link', title: 'Tourism & Community', text: 'Discover community connections, destinations, and visitor resources.' },
    ],
  },
  '/calendar': {
    kind: 'calendar',
    navTitle: 'Calendar',
    eyebrow: 'Lee County Calendar',
    title: 'County Calendar',
    intro: 'View upcoming government meetings, community events, deadlines, and other important dates across Lee County.',
  },
  '/public-notices': {
    kind: 'documents',
    category: 'Public Notices',
    navTitle: 'Public Notices',
    eyebrow: 'Official County Information',
    title: 'Public Notices',
    intro: 'Access official notices, announcements, public hearings, and other important information from Lee County.',
  },
  '/documents': {
    kind: 'documents',
    category: null,
    navTitle: 'Documents',
    eyebrow: 'County Records & Resources',
    title: 'Document Library',
    intro: 'Browse published notices, meeting records, bids, budgets, forms, reports, policies, and other Lee County documents.',
  },
  '/meeting-minutes': {
    kind: 'meetings',
    category: 'Meeting Minutes',
    navTitle: 'Meetings & Agendas',
    eyebrow: 'Meetings & Agendas',
    title: 'Meetings & Agendas',
    intro: 'Search the past three years of Lee County Board of Supervisors agendas, approved minutes, and audio recordings.',
  },
  '/bid-notices': {
    kind: 'documents',
    category: 'Bid Notices',
    navTitle: 'Bid Notices',
    eyebrow: 'Procurement Opportunities',
    title: 'Bid Notices',
    intro: 'View current Lee County bids, requests for proposals, and procurement documents.',
  },
  '/county-budgets': {
    kind: 'documents',
    category: 'County Budgets',
    navTitle: 'County Budgets',
    eyebrow: 'Financial Information',
    title: 'County Budgets',
    intro: 'Review published county budgets and related public financial documents.',
  },
}

const documentCategories = [
  'Public Notices',
  'Meeting Minutes',
  'Bid Notices',
  'County Budgets',
  'Forms',
  'Reports',
  'Policies',
  'Other',
]

function Icon({ name, size = 24 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const icons = {
    notice: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.7 21h-3.4" /></>,
    meeting: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9h18" /><path d="m9 15 2 2 4-4" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    building: <><path d="M4 21h16M6 21V6l6-3 6 3v15" /><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" /></>,
    inspection: <><path d="M4 21V4a1 1 0 0 1 1-1h10l5 5v13" /><path d="M14 3v6h6M8 13h8M8 17h5" /><path d="m6.5 9 1 1 2-2" /></>,
    zoning: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 21v-7h7" /></>,
    map: <><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" /><path d="M9 3v15M15 6v15" /></>,
    recycle: <><path d="m7 19-2-3 2-3M5 16h5M9 5l2-2 2 2M11 3l2.5 4.5M19 13l1 3-3 1M20 16h-5" /><path d="M8 8 5.5 12M16 8l2.5 4" /></>,
    departments: <><path d="M3 21h18M5 21V8l7-4 7 4v13" /><path d="M8 11h2M14 11h2M8 15h2M14 15h2" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3 3 0 0 1 0 5.5M17 14a5 5 0 0 1 4 5" /></>,
    columns: <><path d="M3 21h18M5 18h14M6 8v8M10 8v8M14 8v8M18 8v8M4 6l8-4 8 4z" /></>,
    scales: <><path d="M12 3v18M7 21h10M5 6h14M5 6l-3 7h6L5 6ZM19 6l-3 7h6l-3-7Z" /></>,
    resources: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2M12 3v2M21 12h-2M5 12H3M12 19v2" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
    employment: <><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 11l2 2 4-4" /></>,
    form: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    payment: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
    property: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-6h6v6" /></>,
    budget: <><path d="M4 22V10M10 22V2M16 22v-7M22 22V6" /></>,
    audit: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8" /><path d="M14 2v6h6v5M8 13h4M8 17h3" /><circle cx="17" cy="17" r="3" /><path d="m19.2 19.2 2.3 2.3" /></>,
    disbursement: <><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M16 2v4M8 2v4M2 11h20M8 15h3" /></>,
    code: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M9 7h7M9 11h7" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 13 13 0 0 0 2.8.7 2 2 0 0 1 1.7 2Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    audio: <><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
    external: <><path d="M15 3h6v6M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
    road: <><path d="M8 3 6 21M16 3l2 18M12 4v3M12 10v4M12 17v3" /></>,
    water: <path d="M12 2s7 7.1 7 12a7 7 0 0 1-14 0c0-4.9 7-12 7-12Z" />,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  }
  return <svg {...common}>{icons[name] || icons.arrow}</svg>
}

function ArrowLink({ children, href = '#' }) {
  return <a className="arrow-link" href={sitePath(href)}><span>{children}</span><Icon name="arrow" size={19} /></a>
}

function PageHero({ page }) {
  return (
    <section className="interior-hero">
      <div className="interior-hero-pattern" aria-hidden="true" />
      <div className="container interior-hero-content">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><a href={sitePath('/')}>Home</a><Icon name="chevron" size={14} /><span>{page.navTitle}</span></nav>
        <p className="eyebrow light">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
      </div>
    </section>
  )
}

function formatDocumentDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day))
}

function formatNoticeDeadline(value) {
  if (!value) return ''
  const localMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  const date = localMatch
    ? new Date(Number(localMatch[1]), Number(localMatch[2]) - 1, Number(localMatch[3]), Number(localMatch[4]), Number(localMatch[5]))
    : new Date(value)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function getPublicRecordRetentionCutoff() {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - PUBLIC_RECORD_RETENTION_YEARS)
  const year = cutoff.getFullYear()
  const month = String(cutoff.getMonth() + 1).padStart(2, '0')
  const day = String(cutoff.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isRetainedPublicNotice(notice, cutoff = getPublicRecordRetentionCutoff()) {
  const noticeDate = notice.posted_at || notice.published_at?.slice(0, 10) || notice.created_at?.slice(0, 10)
  return Boolean(noticeDate && noticeDate >= cutoff)
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const localMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (localMatch && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return `${localMatch[1]}T${localMatch[2]}`
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value)).reduce((result, part) => ({ ...result, [part.type]: part.value }), {})
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function adminEventFormFromRecord(item) {
  const start = toDateTimeLocal(item.start_at)
  const end = toDateTimeLocal(item.end_at)
  const category = EVENT_CATEGORIES.find((option) => option.toLowerCase() === item.category?.trim().toLowerCase()) || 'Other'
  return {
    title: item.title || '',
    category,
    description: item.description || '',
    startDate: start.slice(0, 10),
    startTime: item.all_day ? '' : start.slice(11, 16),
    endDate: end.slice(0, 10),
    endTime: item.all_day ? '' : end.slice(11, 16),
    allDay: Boolean(item.all_day),
    locationName: item.location_name || '',
    address: item.address || '',
    websiteUrl: item.website_url || '',
    status: item.status || 'pending',
    isPublished: Boolean(item.is_published),
  }
}

function formatAdminEventSchedule(item) {
  if (!item.start_at) return 'Date not set'
  const start = new Date(item.start_at)
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(start)
  if (item.all_day) return `${date} · All day`
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  }).format(start)
  return `${date} · ${time} ET`
}

function adminEventContact(item) {
  const contact = item.event_submission_contacts
  return Array.isArray(contact) ? contact[0] : contact
}

function noticeIcon(notice) {
  if (notice.icon) return notice.icon
  const label = `${notice.notice_type} ${notice.title}`.toLowerCase()
  if (label.includes('proposal') || label.includes('bid')) return 'briefcase'
  if (label.includes('survey') || label.includes('input')) return 'road'
  if (label.includes('well')) return 'water'
  if (label.includes('statement')) return 'shield'
  if (label.includes('hearing')) return 'meeting'
  return 'notice'
}

function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'notice'
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getDocumentMimeType(file) {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  const types = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }
  return types[extension] || ''
}

function PublicDocumentLibrary({ page }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDocuments() {
      if (!supabase) {
        setError('The document library is not connected yet.')
        setLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('county_documents')
        .select('id,title,description,category,document_date,file_name,storage_path,mime_type,file_size')
        .eq('category', page.category)
        .eq('is_published', true)
        .order('document_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (!active) return
      if (queryError) {
        setError('The document library is being configured. Please check back soon.')
        setLoading(false)
        return
      }

      const withUrls = await Promise.all((data || []).map(async (document) => {
        const { data: signedData } = await supabase.storage
          .from(DOCUMENT_BUCKET)
          .createSignedUrl(document.storage_path, 3600, { download: document.file_name })
        return { ...document, downloadUrl: signedData?.signedUrl || '' }
      }))

      if (active) {
        setDocuments(withUrls)
        setLoading(false)
      }
    }

    loadDocuments()
    return () => { active = false }
  }, [page.category])

  return (
    <main id="main-content" className="interior-page">
      <PageHero page={page} />
      <section className="section document-library-section">
        <div className="container document-library-layout">
          <aside className="document-sidebar">
            <p className="eyebrow">Public Information</p>
            <h2>Document library</h2>
            <nav aria-label="Document categories">
              <a className={page.category === 'Public Notices' ? 'active' : ''} href={sitePath('/public-notices')}>Public Notices</a>
              <a className={page.category === 'Meeting Minutes' ? 'active' : ''} href={sitePath('/meeting-minutes')}>Meeting Minutes</a>
              <a className={page.category === 'Bid Notices' ? 'active' : ''} href={sitePath('/bid-notices')}>Bid Notices</a>
              <a className={page.category === 'County Budgets' ? 'active' : ''} href={sitePath('/county-budgets')}>County Budgets</a>
            </nav>
          </aside>
          <div className="document-results">
            <div className="document-results-heading"><div><p className="eyebrow">Published Records</p><h2>{page.category}</h2></div><span>{loading ? 'Loading…' : `${documents.length} document${documents.length === 1 ? '' : 's'}`}</span></div>
            {error && <div className="document-state" role="status"><Icon name="notice" size={28} /><h3>Documents unavailable</h3><p>{error}</p></div>}
            {!error && !loading && documents.length === 0 && <div className="document-state"><Icon name="form" size={28} /><h3>No documents published yet</h3><p>Published {page.category.toLowerCase()} will appear here.</p></div>}
            {!error && documents.length > 0 && <div className="document-list">
              {documents.map((document) => (
                <article className="document-row" key={document.id}>
                  <span className="document-type"><Icon name="form" size={24} /></span>
                  <div><p>{formatDocumentDate(document.document_date)} · {formatFileSize(document.file_size)}</p><h3>{document.title}</h3>{document.description && <span>{document.description}</span>}<small>{document.file_name}</small></div>
                  {document.downloadUrl ? <a href={document.downloadUrl} target="_blank" rel="noreferrer">Download <Icon name="arrow" size={17} /></a> : <span className="download-unavailable">Unavailable</span>}
                </article>
              ))}
            </div>}
          </div>
        </div>
      </section>
    </main>
  )
}

function PublicNoticesPage({ page }) {
  const [notices, setNotices] = useState(isSupabaseConfigured ? [] : fallbackPublicNotices.filter((notice) => isRetainedPublicNotice(notice)))
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    if (!supabase) return undefined

    async function loadNotices() {
      const today = new Date().toISOString().slice(0, 10)
      const retentionCutoff = getPublicRecordRetentionCutoff()
      const { data, error } = await supabase
        .from('public_notices')
        .select('id,slug,title,notice_type,summary,body,posted_at,deadline_at,expires_at,contact_name,contact_phone,submission_address,action_url,action_label,attachment_name,attachment_path,attachment_size,is_featured,status,published_at,created_at')
        .eq('status', 'published')
        .or(`expires_at.is.null,expires_at.gte.${today}`)
        .or(`posted_at.gte.${retentionCutoff},and(posted_at.is.null,published_at.gte.${retentionCutoff}),and(posted_at.is.null,published_at.is.null,created_at.gte.${retentionCutoff})`)
        .order('is_featured', { ascending: false })
        .order('posted_at', { ascending: false })

      if (!active) return
      if (error) {
        setNotices([])
        setLoadError('Current notices could not be loaded. Please try again shortly or contact County Administration.')
        setLoading(false)
        return
      }

      const retainedNotices = (data || []).filter((notice) => isRetainedPublicNotice(notice, retentionCutoff))
      const noticesWithFiles = await Promise.all(retainedNotices.map(async (notice) => {
        if (!notice.attachment_path) return notice
        const { data: signedData } = await supabase.storage
          .from(DOCUMENT_BUCKET)
          .createSignedUrl(notice.attachment_path, 3600, { download: notice.attachment_name })
        return { ...notice, attachment_url: signedData?.signedUrl || '' }
      }))

      if (active) {
        setNotices(noticesWithFiles)
        setLoading(false)
      }
    }

    loadNotices()
    return () => { active = false }
  }, [])

  const boardStatements = notices.filter((notice) => notice.notice_type === 'Board statement')
  const currentNotices = notices.filter((notice) => notice.notice_type !== 'Board statement')

  return (
    <main id="main-content" className="interior-page public-notices-page">
      <PageHero page={page} />

      <section className="notice-resources" aria-labelledby="notice-resources-heading">
        <div className="container notice-resources-inner">
          <div className="notice-resources-heading">
            <p className="eyebrow">Official resources</p>
            <h2 id="notice-resources-heading">Frequently requested documents</h2>
          </div>
          <div className="notice-resource-links">
            {publicNoticeResources.map((resource) => (
              <a href={resource.href} target="_blank" rel="noreferrer" key={resource.title}>
                <span className="notice-resource-icon"><Icon name={resource.icon} size={25} /></span>
                <span><strong>{resource.title}</strong><small>{resource.text}</small><em>{resource.label}</em></span>
                <Icon name="external" size={18} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section notices-section" aria-labelledby="current-notices-heading">
        <div className="container notices-layout">
          <aside className="notices-sidebar">
            <p className="eyebrow">Public information</p>
            <h2 id="current-notices-heading">Current notices</h2>
            <p>Official announcements, opportunities, and requests for public participation from Lee County and its partners.</p>
            {currentNotices.length > 0 && <nav aria-label="Notices on this page">
              {currentNotices.map((notice) => <a href={`#${notice.slug || notice.id}`} key={notice.id}>{notice.title}</a>)}
            </nav>}
          </aside>

          <div className="notices-list">
            {loading && <div className="document-state" role="status"><p>Loading current notices…</p></div>}
            {!loading && loadError && <div className="document-state" role="status"><Icon name="notice" size={28} /><h3>Notices temporarily unavailable</h3><p>{loadError}</p></div>}
            {!loading && !loadError && currentNotices.length === 0 && <div className="document-state"><Icon name="notice" size={28} /><h3>No current notices</h3><p>New notices will appear here as they are published.</p></div>}
            {!loading && currentNotices.map((notice) => {
              const actionUrl = notice.attachment_url || notice.action_url
              const actionLabel = notice.action_label || (notice.attachment_path ? 'Download attachment' : 'Learn more')
              return (
              <article className={`notice-card${notice.is_featured ? ' notice-card-featured' : ''}`} id={notice.slug || notice.id} key={notice.id}>
                <div className="notice-card-topline">
                  <span className="notice-card-icon"><Icon name={noticeIcon(notice)} size={25} /></span>
                  <span className="notice-type">{notice.notice_type}</span>
                  {notice.posted_at && <time dateTime={notice.posted_at}>{formatDocumentDate(notice.posted_at)}</time>}
                </div>
                <h3>{notice.title}</h3>
                <p className="notice-summary">{notice.summary}</p>
                {notice.body && <p>{notice.body}</p>}

                {(notice.deadline_at || notice.contact_name || notice.submission_address) && <dl className="notice-facts">
                  {notice.deadline_at && <div><dt>Deadline</dt><dd>{formatNoticeDeadline(notice.deadline_at)}</dd></div>}
                  {(notice.contact_name || notice.contact_phone) && <div><dt>Contact</dt><dd>{notice.contact_name}{notice.contact_phone && <><br /><a href={`tel:${notice.contact_phone.replace(/\D/g, '')}`}>{notice.contact_phone}</a></>}</dd></div>}
                  {notice.submission_address && <div><dt>Submit to</dt><dd>{notice.submission_address}</dd></div>}
                </dl>}

                {actionUrl && <a className="notice-action" href={actionUrl} target="_blank" rel="noreferrer">{actionLabel}<Icon name={notice.attachment_path || actionUrl.toLowerCase().includes('.pdf') ? 'external' : 'arrow'} size={18} /></a>}
              </article>
            )})}
          </div>
        </div>
      </section>

      {boardStatements.map((statement) => <section className="notice-statement" aria-labelledby={`statement-${statement.id}`} key={statement.id}>
          <div className="container notice-statement-inner">
            <span className="notice-statement-icon"><Icon name="shield" size={31} /></span>
            <div><p className="eyebrow light">Statement from the Board</p><h2 id={`statement-${statement.id}`}>{statement.title}</h2><p>{statement.summary}</p>{statement.body && <p>{statement.body}</p>}</div>
          </div>
        </section>)}

      <section className="notice-help">
        <div className="container notice-help-inner">
          <div><p className="eyebrow">Questions about a notice?</p><h2>Contact County Administration</h2><p>County staff can help you locate a document or connect with the office responsible for a notice.</p></div>
          <div className="notice-help-actions"><a href="tel:2763467714"><Icon name="phone" size={18} />(276) 346-7714</a><a href={sitePath('/documents')}>Browse all documents<Icon name="arrow" size={18} /></a></div>
        </div>
      </section>
    </main>
  )
}

function MeetingAudioPlayer({ document }) {
  const [playbackState, setPlaybackState] = useState('idle')
  const label = `Audio recording${document.part ? ` part ${document.part}` : ''}`

  return (
    <div className="meeting-audio-recording">
      <div className="meeting-audio-heading"><Icon name="audio" size={18} /><span>Audio{document.part ? ` · Part ${document.part}` : ''}</span><a href={document.download_url} target="_blank" rel="noreferrer" aria-label={`Open ${label.toLowerCase()} in a new tab`}><Icon name="external" size={15} /></a></div>
      <div className="meeting-audio-player">
        <audio
          controls
          preload="none"
          src={document.download_url}
          aria-label={label}
          onPlay={() => setPlaybackState('loading')}
          onPlaying={() => setPlaybackState('playing')}
          onWaiting={() => setPlaybackState((current) => current === 'idle' ? current : 'loading')}
          onStalled={() => setPlaybackState((current) => current === 'idle' ? current : 'loading')}
          onPause={() => setPlaybackState('idle')}
          onEnded={() => setPlaybackState('idle')}
          onError={() => setPlaybackState('error')}
        >
          Your browser does not support audio playback.
        </audio>
        {playbackState === 'loading' && <p className="meeting-audio-status" role="status" aria-live="polite"><span className="meeting-audio-spinner" aria-hidden="true" />Loading recording…</p>}
        {playbackState === 'error' && <p className="meeting-audio-status error" role="alert">This recording could not be loaded. Try opening it in a new tab.</p>}
      </div>
    </div>
  )
}

function MeetingArchivePage({ page }) {
  const [documents, setDocuments] = useState(staticMeetingDocuments)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [documentType, setDocumentType] = useState('all')
  const [meetingType, setMeetingType] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    if (!supabase) return undefined

    async function loadMeetingDocuments() {
      const retentionCutoff = getPublicRecordRetentionCutoff()
      const { data, error: queryError } = await supabase
        .from('meeting_documents')
        .select('id,title,meeting_date,meeting_type,document_type,external_url,file_name,storage_path,file_size')
        .eq('is_published', true)
        .gte('meeting_date', retentionCutoff)
        .order('meeting_date', { ascending: false })
        .order('document_type', { ascending: true })

      if (!active) return
      if (queryError) {
        setError('Recently added records could not be checked right now. The retained three-year archive is still available below.')
        setLoading(false)
        return
      }

      const withUrls = await Promise.all((data || []).map(async (document) => {
        if (!document.storage_path) return { ...document, download_url: document.external_url || '' }
        const { data: signedData } = await supabase.storage
          .from(DOCUMENT_BUCKET)
          .createSignedUrl(document.storage_path, 3600, { download: document.file_name })
        return { ...document, source: 'database', download_url: signedData?.signedUrl || document.external_url || '' }
      }))

      if (active) {
        const databaseKeys = new Set(withUrls.map(meetingDocumentIdentity))
        const historicalFallbacks = staticMeetingDocuments.filter((document) => !databaseKeys.has(meetingDocumentIdentity(document)))
        setDocuments([...withUrls, ...historicalFallbacks].sort((a, b) => b.meeting_date.localeCompare(a.meeting_date) || a.document_type.localeCompare(b.document_type)))
        setLoading(false)
      }
    }

    loadMeetingDocuments()
    return () => { active = false }
  }, [])

  const yearCounts = documents.reduce((counts, document) => {
    const documentYear = document.meeting_date?.slice(0, 4)
    if (documentYear) counts[documentYear] = (counts[documentYear] || 0) + 1
    return counts
  }, {})

  const availableMeetingTypes = [...new Set(documents.map((document) => document.meeting_type).filter(Boolean))].sort()
  const cleanSearch = search.trim().toLowerCase()
  const filteredDocuments = documents.filter((document) => {
    if (document.meeting_date?.slice(0, 4) !== year) return false
    if (documentType !== 'all' && document.document_type.toLowerCase() !== documentType) return false
    if (meetingType !== 'all' && document.meeting_type !== meetingType) return false
    if (!cleanSearch) return true
    return `${document.title} ${document.meeting_type} ${formatDocumentDate(document.meeting_date)}`.toLowerCase().includes(cleanSearch)
  })

  const meetingGroups = filteredDocuments.reduce((groups, document) => {
    const key = `${document.meeting_date}|${document.meeting_type}`
    if (!groups[key]) groups[key] = { meeting_date: document.meeting_date, meeting_type: document.meeting_type, documents: [] }
    groups[key].documents.push(document)
    return groups
  }, {})
  const groupedMeetings = Object.values(meetingGroups).sort((a, b) => b.meeting_date.localeCompare(a.meeting_date) || a.meeting_type.localeCompare(b.meeting_type))

  return (
    <main id="main-content" className="interior-page meeting-archive-page">
      <PageHero page={page} />
      <section className="meeting-year-bar" aria-labelledby="meeting-years-heading">
        <div className="container">
          <div className="meeting-year-heading"><div><p className="eyebrow">Public record archive</p><h2 id="meeting-years-heading">Browse by year</h2></div><p>Agendas, approved minutes, and available audio recordings are organized by meeting date.</p></div>
          <div className="meeting-year-list" role="list" aria-label="Meeting archive years">
            {meetingYears.map((item) => <button type="button" className={year === String(item) ? 'active' : ''} onClick={() => setYear(String(item))} aria-pressed={year === String(item)} key={item}><strong>{item}</strong><span>{yearCounts[item] || 0} files</span></button>)}
          </div>
        </div>
      </section>

      <section className="section meeting-records-section" aria-labelledby="meeting-records-heading">
        <div className="container">
          <div className="meeting-results-heading"><div><p className="eyebrow">Board of Supervisors</p><h2 id="meeting-records-heading">{year} meeting records</h2></div><span>{filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'}</span></div>

          <div className="meeting-filters" aria-label="Meeting record filters">
            <label>Record type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="all">All records</option><option value="agenda">Agendas only</option><option value="minutes">Minutes only</option><option value="audio">Audio only</option></select></label>
            <label>Meeting type<select value={meetingType} onChange={(event) => setMeetingType(event.target.value)}><option value="all">All meeting types</option>{availableMeetingTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="meeting-search"><span>Search this year</span><div><Icon name="search" size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meetings" /></div></label>
            {(documentType !== 'all' || meetingType !== 'all' || search) && <button type="button" className="clear-meeting-filters" onClick={() => { setDocumentType('all'); setMeetingType('all'); setSearch('') }}>Clear filters</button>}
          </div>

          {loading && <p className="meeting-sync-status" role="status">Checking for newly published records…</p>}
          {error && <div className="meeting-archive-note" role="status"><Icon name="notice" size={19} /><p>{error}</p></div>}
          {groupedMeetings.length === 0 && <div className="document-state"><Icon name="meeting" size={28} /><h3>No matching records for {year}</h3><p>Try another year or clear the filters. Records will appear here as they are published.</p></div>}
          {groupedMeetings.length > 0 && <div className="meeting-record-list">
            {groupedMeetings.map((meeting) => {
              const [meetingYear, meetingMonth, meetingDay] = meeting.meeting_date.split('-').map(Number)
              const meetingDate = new Date(meetingYear, meetingMonth - 1, meetingDay)
              return <article className="meeting-record" key={`${meeting.meeting_date}-${meeting.meeting_type}`}>
                <div className="meeting-date-block"><span>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(meetingDate)}</span><strong>{meetingDay}</strong><small>{meetingYear}</small></div>
                <div className="meeting-record-copy"><p>Lee County Board of Supervisors</p><h3>{meeting.meeting_type}</h3><time dateTime={meeting.meeting_date}>{formatDocumentDate(meeting.meeting_date)}</time></div>
                <div className="meeting-document-actions">{meeting.documents.map((document) => {
                  if (!document.download_url) return <span className="meeting-file-unavailable" key={document.id}>{document.document_type} unavailable</span>
                  if (document.document_type === 'Audio') return <MeetingAudioPlayer document={document} key={document.id} />
                  return <a className={document.document_type.toLowerCase()} href={document.download_url} target="_blank" rel="noreferrer" key={document.id}><Icon name="form" size={18} /><span>{document.document_type}<small>{document.file_size ? formatFileSize(document.file_size) : 'PDF'}</small></span><Icon name="external" size={15} /></a>
                })}</div>
              </article>
            })}
          </div>}
        </div>
      </section>
    </main>
  )
}

function CountyCalendarPage({ page }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [submissionMode, setSubmissionMode] = useState('single')
  const [allDay, setAllDay] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState('idle')
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [csvEvents, setCsvEvents] = useState([])
  const [csvErrors, setCsvErrors] = useState([])
  const [csvFileName, setCsvFileName] = useState('')

  useEffect(() => {
    let active = true

    async function loadEvents() {
      if (!supabase) {
        setError('The county calendar is not connected yet.')
        setLoading(false)
        return
      }

      const cutoff = new Date()
      cutoff.setHours(0, 0, 0, 0)
      const { data, error: queryError } = await supabase
        .from('events')
        .select('id,title,description,start_at,end_at,all_day,location_name,address,category')
        .eq('status', 'approved')
        .eq('is_published', true)
        .gte('start_at', cutoff.toISOString())
        .order('start_at', { ascending: true })
        .limit(50)

      if (!active) return
      if (queryError) setError('The calendar could not be loaded right now.')
      else setEvents(data || [])
      setLoading(false)
    }

    loadEvents()
    return () => { active = false }
  }, [])

  const categoryOptions = [...EVENT_CATEGORIES]
  events.forEach((event) => {
    const category = event.category?.trim()
    if (category && !categoryOptions.some((option) => option.toLowerCase() === category.toLowerCase())) {
      categoryOptions.push(category)
    }
  })

  const normalizedSearch = search.trim().toLowerCase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const filteredEvents = events.filter((event) => {
    const eventCategory = event.category?.trim().toLowerCase() || ''
    const matchesCategory = categoryFilter === 'all' || eventCategory === categoryFilter.toLowerCase()
    const searchableText = [event.title, event.description, event.location_name, event.address, event.category]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch)

    let matchesDate = true
    if (dateFilter !== 'all') {
      const rangeEnd = new Date(today)
      rangeEnd.setDate(rangeEnd.getDate() + Number(dateFilter))
      const eventStart = new Date(event.start_at)
      matchesDate = eventStart >= today && eventStart < rangeEnd
    }

    return matchesCategory && matchesSearch && matchesDate
  })
  const hasActiveFilters = categoryFilter !== 'all' || dateFilter !== 'all' || Boolean(normalizedSearch)

  function clearFilters() {
    setCategoryFilter('all')
    setDateFilter('all')
    setSearch('')
  }

  function changeSubmissionMode(mode) {
    setSubmissionMode(mode)
    setSubmissionStatus('idle')
    setSubmissionMessage('')
  }

  async function handleCsvFile(event) {
    const [file] = event.target.files
    setCsvEvents([])
    setCsvErrors([])
    setCsvFileName(file?.name || '')
    setSubmissionStatus('idle')
    setSubmissionMessage('')
    if (!file) return
    if (file.size > EVENT_CSV_MAX_BYTES) {
      setCsvErrors(['The CSV file must be 2 MB or smaller.'])
      return
    }
    try {
      const parsed = parseEventCsv(await file.text())
      setCsvEvents(parsed.events)
      setCsvErrors(parsed.errors)
    } catch (fileError) {
      setCsvErrors([fileError.message || 'The CSV file could not be read.'])
    }
  }

  async function handleEventSubmission(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    if (formData.get('company')) {
      formElement.reset()
      setAllDay(false)
      setCsvEvents([])
      setCsvErrors([])
      setCsvFileName('')
      setSubmissionStatus('success')
      setSubmissionMessage('Thank you! Your events were submitted successfully and will appear after review.')
      return
    }
    if (!supabase) {
      setSubmissionStatus('error')
      setSubmissionMessage('The event submission service is not connected yet.')
      return
    }
    if (submissionMode === 'csv' && csvErrors.length > 0) {
      setSubmissionStatus('error')
      setSubmissionMessage('Fix the CSV errors and upload the file again before submitting.')
      return
    }
    if (submissionMode === 'csv' && csvEvents.length === 0) {
      setSubmissionStatus('error')
      setSubmissionMessage('Choose a CSV file containing at least one event.')
      return
    }

    setSubmissionStatus('submitting')
    setSubmissionMessage('')
    try {
      const submitterName = String(formData.get('submitterName') || '').trim()
      const submitterEmail = String(formData.get('submitterEmail') || '').trim()
      if (submissionMode === 'csv') {
        const { error: submissionError } = await supabase.rpc('submit_calendar_events', {
          p_events: csvEvents.map(({ payload }) => ({
            title: payload.title,
            description: payload.description,
            start_at: payload.startAt,
            end_at: payload.endAt,
            all_day: payload.allDay,
            location_name: payload.locationName,
            address: payload.address,
            website_url: payload.websiteUrl,
            category: payload.category,
          })),
          p_submitter_name: submitterName,
          p_submitter_email: submitterEmail,
        })
        if (submissionError) throw submissionError
        const submittedCount = csvEvents.length
        formElement.reset()
        setCsvEvents([])
        setCsvErrors([])
        setCsvFileName('')
        setSubmissionStatus('success')
        setSubmissionMessage(`${submittedCount} event${submittedCount === 1 ? '' : 's'} submitted successfully. They will appear after review and approval.`)
        return
      }

      const startDate = parseEventDate(String(formData.get('startDate') || ''), 'Start date', true)
      const endDate = parseEventDate(String(formData.get('endDate') || ''), 'End date')
      const payload = prepareEventPayload({
        title: String(formData.get('title') || ''),
        category: String(formData.get('category') || ''),
        description: String(formData.get('description') || ''),
        startDate,
        startTime: allDay ? '' : parseEventTime(String(formData.get('startTime') || ''), 'Start time', true),
        endDate,
        endTime: allDay ? '' : parseEventTime(String(formData.get('endTime') || ''), 'End time'),
        allDay,
        locationName: String(formData.get('locationName') || ''),
        address: String(formData.get('address') || ''),
        websiteUrl: String(formData.get('websiteUrl') || ''),
      })
      const { error: submissionError } = await supabase.rpc('submit_calendar_event', {
        p_title: payload.title,
        p_description: payload.description,
        p_start_at: payload.startAt,
        p_end_at: payload.endAt,
        p_all_day: payload.allDay,
        p_location_name: payload.locationName,
        p_address: payload.address,
        p_website_url: payload.websiteUrl,
        p_category: payload.category,
        p_submitter_name: submitterName,
        p_submitter_email: submitterEmail,
      })
      if (submissionError) throw submissionError
      formElement.reset()
      setAllDay(false)
      setSubmissionStatus('success')
      setSubmissionMessage('Thank you! Your event was submitted successfully and will appear after it is reviewed and approved.')
    } catch (submissionError) {
      setSubmissionStatus('error')
      setSubmissionMessage(submissionError.message || 'Your events could not be submitted. Please try again.')
    }
  }

  return (
    <main id="main-content" className="interior-page">
      <PageHero page={page} />
      <section className="section county-calendar-section">
        <div className="container">
          <div className="calendar-page-heading"><div><p className="eyebrow">Upcoming Dates</p><h2>What’s happening in Lee County</h2></div><div className="calendar-page-actions"><a href="#submit-an-event">Submit events <Icon name="arrow" size={17} /></a><a href={sitePath('/admin')}>Administrator sign in <Icon name="arrow" size={17} /></a></div></div>
          {loading && <div className="document-state"><p>Loading calendar…</p></div>}
          {error && <div className="document-state" role="status"><Icon name="calendar" size={28} /><h3>Calendar unavailable</h3><p>{error}</p></div>}
          {!loading && !error && <div className="calendar-filters" aria-label="Calendar filters">
            <div className="calendar-filter-heading"><div><h3>Filter events</h3><p>Choose an event type, date range, or search by name and location.</p></div>{hasActiveFilters && <button type="button" onClick={clearFilters}>Clear all filters</button>}</div>
            <div className="calendar-category-options" role="group" aria-label="Filter by event type">
              <button type="button" aria-pressed={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>All events <span>{events.length}</span></button>
              {categoryOptions.map((category) => {
                const count = events.filter((event) => event.category?.trim().toLowerCase() === category.toLowerCase()).length
                return <button type="button" aria-pressed={categoryFilter.toLowerCase() === category.toLowerCase()} onClick={() => setCategoryFilter(category)} key={category}>{category} <span>{count}</span></button>
              })}
            </div>
            <div className="calendar-filter-controls">
              <label className="calendar-search"><span>Search events</span><div><Icon name="search" size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by event or location" /></div></label>
              <label><span>Date range</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="all">Any upcoming date</option><option value="1">Today</option><option value="7">Next 7 days</option><option value="30">Next 30 days</option></select></label>
            </div>
            <p className="calendar-results-summary" aria-live="polite">Showing <strong>{filteredEvents.length}</strong> of {events.length} upcoming event{events.length === 1 ? '' : 's'}</p>
          </div>}
          {!loading && !error && events.length === 0 && <div className="document-state"><Icon name="calendar" size={28} /><h3>No upcoming events</h3><p>New county and community dates will appear here as they are published.</p></div>}
          {!error && events.length > 0 && filteredEvents.length === 0 && <div className="document-state"><Icon name="search" size={28} /><h3>No matching events</h3><p>Try another event type, date range, or search term.</p><button className="calendar-clear-button" type="button" onClick={clearFilters}>Show all events</button></div>}
          {!error && filteredEvents.length > 0 && <div className="calendar-event-list">{filteredEvents.map((event) => {
            const start = new Date(event.start_at)
            return <article className="calendar-event" key={event.id}><div className="event-date"><strong>{new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(start)}</strong><span>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start)}</span></div><div><p>{event.category}{!event.all_day && ` · ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(start)}`}</p><h3>{event.title}</h3>{event.location_name && <span>{event.location_name}{event.address ? ` — ${event.address}` : ''}</span>}{event.description && <small>{event.description}</small>}</div></article>
          })}</div>}
        </div>
      </section>
      <section className="section calendar-submit-section" id="submit-an-event">
        <div className="container calendar-submit-layout">
          <div className="calendar-submit-intro">
            <p className="eyebrow">Share What’s Happening</p>
            <h2>Add your events</h2>
            <p>Hosting something in Lee County? Enter one event or upload a CSV spreadsheet with up to {EVENT_CSV_MAX_EVENTS} events. Every submission is reviewed before it appears publicly.</p>
            <div className="calendar-submit-note"><Icon name="calendar" size={27} /><p><strong>Good to know</strong><span>Your name and email stay private and are used only if an administrator has a question about the submission.</span></p></div>
          </div>
          <form className="event-submission-form" onSubmit={handleEventSubmission}>
            <div className="event-submission-modes" role="group" aria-label="Event submission method">
              <button type="button" aria-pressed={submissionMode === 'single'} onClick={() => changeSubmissionMode('single')}>Enter one event</button>
              <button type="button" aria-pressed={submissionMode === 'csv'} onClick={() => changeSubmissionMode('csv')}>Upload CSV</button>
            </div>

            {submissionMode === 'single' && <div className="event-submission-fields">
              <div className="event-field-row">
                <label>Event title<input name="title" type="text" maxLength="120" required /></label>
                <label>Category<select name="category" defaultValue="" required><option value="" disabled>Choose a category…</option>{EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
              </div>
              <label>Description <span>Optional</span><textarea name="description" rows="5" maxLength="4000" placeholder="Tell people what to expect, what to bring, and any cost to attend." /></label>
              <label className="event-all-day"><input name="allDay" type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} /> This is an all-day event</label>
              <div className="event-field-row event-date-fields">
                <label>Start date<input name="startDate" type="date" required /></label>
                {!allDay && <label>Start time<input name="startTime" type="time" required /></label>}
                <label>End date <span>Optional</span><input name="endDate" type="date" /></label>
                {!allDay && <label>End time <span>Optional</span><input name="endTime" type="time" /></label>}
              </div>
              <div className="event-field-row">
                <label>Venue <span>Optional</span><input name="locationName" type="text" maxLength="160" placeholder="Venue or meeting place" /></label>
                <label>Address <span>Optional</span><input name="address" type="text" maxLength="240" autoComplete="street-address" /></label>
              </div>
              <label>Event website <span>Optional</span><input name="websiteUrl" type="url" maxLength="500" inputMode="url" placeholder="https://example.com/event" /></label>
            </div>}

            {submissionMode === 'csv' && <section className="event-csv-upload" aria-labelledby="event-csv-title">
              <div className="event-csv-heading"><div><h3 id="event-csv-title">Upload your event spreadsheet</h3><p>Keep the template headers unchanged. Dates may use YYYY-MM-DD or M/D/YYYY, and times may use 18:30 or 6:30 PM.</p></div><a href={sitePath('/event-upload-template.csv')} download>Download CSV template</a></div>
              <p className="event-csv-columns"><strong>Columns:</strong> {EVENT_CSV_COLUMNS.join(', ')}</p>
              <label className="event-csv-file"><span>Choose CSV file</span><input type="file" accept=".csv,text/csv" onChange={handleCsvFile} /><small>Maximum {EVENT_CSV_MAX_EVENTS} events and 2 MB.</small></label>
              {csvErrors.length > 0 && <div className="event-csv-errors" role="alert"><strong>{csvFileName || 'CSV'} could not be submitted:</strong><ul>{csvErrors.map((csvError) => <li key={csvError}>{csvError}</li>)}</ul></div>}
              {csvEvents.length > 0 && <div className="event-csv-preview">
                <div className="event-csv-preview-heading"><div><strong>{csvFileName}</strong><span>{csvEvents.length} event{csvEvents.length === 1 ? '' : 's'} ready</span></div>{csvErrors.length === 0 && <span>Ready to submit</span>}</div>
                <div className="event-csv-table-wrap"><table><thead><tr><th scope="col">Row</th><th scope="col">Event</th><th scope="col">Schedule</th><th scope="col">Category</th></tr></thead><tbody>{csvEvents.map((csvEvent) => <tr key={csvEvent.csvRow}><td>{csvEvent.csvRow}</td><td><strong>{csvEvent.title}</strong>{csvEvent.locationName && <span>{csvEvent.locationName}</span>}</td><td>{csvEvent.startDate}{csvEvent.allDay ? ' · All day' : ` · ${csvEvent.startTime}`}{csvEvent.endDate && ` – ${csvEvent.endDate}${csvEvent.endTime ? ` · ${csvEvent.endTime}` : ''}`}</td><td>{csvEvent.category}</td></tr>)}</tbody></table></div>
              </div>}
            </section>}

            <fieldset className="event-submitter-contact">
              <legend>Your private contact details</legend>
              <div className="event-field-row">
                <label>Your name<input name="submitterName" type="text" maxLength="140" autoComplete="name" required /></label>
                <label>Your email<input name="submitterEmail" type="email" maxLength="254" autoComplete="email" required /></label>
              </div>
            </fieldset>
            <label className="event-company-field" aria-hidden="true">Company<input name="company" type="text" tabIndex="-1" autoComplete="off" /></label>
            <button className="event-submit-button" type="submit" disabled={submissionStatus === 'submitting' || !supabase || (submissionMode === 'csv' && (csvEvents.length === 0 || csvErrors.length > 0))}>{submissionStatus === 'submitting' ? 'Submitting…' : submissionMode === 'csv' ? `Submit ${csvEvents.length} event${csvEvents.length === 1 ? '' : 's'}` : 'Submit event'}</button>
            {submissionMessage && <p className={`event-submission-message ${submissionStatus}`} role={submissionStatus === 'error' ? 'alert' : 'status'}>{submissionMessage}</p>}
            <p className="event-submission-privacy">By submitting, you confirm that these event details are accurate. Events remain pending until an administrator approves them.</p>
          </form>
        </div>
      </section>
    </main>
  )
}

function AdminPage() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [accessChecked, setAccessChecked] = useState(false)
  const [adminView, setAdminView] = useState('events')
  const [documents, setDocuments] = useState([])
  const [notices, setNotices] = useState([])
  const [meetingDocuments, setMeetingDocuments] = useState([])
  const [adminEvents, setAdminEvents] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [message, setMessage] = useState('')
  const [reportDownloads, setReportDownloads] = useState([])
  const [accessibilityReport, setAccessibilityReport] = useState(null)
  const [taggingPath, setTaggingPath] = useState('')
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', category: 'Public Notices', document_date: new Date().toISOString().slice(0, 10), is_published: true })
  const [noticeForm, setNoticeForm] = useState(emptyNoticeForm)
  const [noticeFile, setNoticeFile] = useState(null)
  const [editingNotice, setEditingNotice] = useState(null)
  const [previewNotice, setPreviewNotice] = useState(null)
  const [meetingForm, setMeetingForm] = useState(emptyMeetingForm)
  const [meetingFile, setMeetingFile] = useState(null)
  const [editingMeeting, setEditingMeeting] = useState(null)
  const [adminMeetingYear, setAdminMeetingYear] = useState(String(new Date().getFullYear()))
  const [eventForm, setEventForm] = useState(emptyAdminEventForm)
  const [editingAdminEvent, setEditingAdminEvent] = useState(null)
  const [adminEventStatus, setAdminEventStatus] = useState('pending')
  const [adminEventSearch, setAdminEventSearch] = useState('')

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data }) => {
      setAccessChecked(false)
      setSession(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAccessChecked(false)
      setIsAdmin(false)
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!previewNotice) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') setPreviewNotice(null) }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [previewNotice])

  useEffect(() => {
    let active = true
    if (!supabase || !session?.user) return undefined

    supabase.from('calendar_admins').select('user_id').eq('user_id', session.user.id).maybeSingle().then(({ data, error }) => {
      if (!active) return
      const approved = Boolean(data && !error)
      setIsAdmin(approved)
      setAccessChecked(true)
      if (approved) {
        Promise.all([
          supabase.from('county_documents').select('*').order('document_date', { ascending: false }).order('created_at', { ascending: false }),
          supabase.from('public_notices').select('*').order('updated_at', { ascending: false }),
          supabase.from('meeting_documents').select('*').order('meeting_date', { ascending: false }).order('document_type', { ascending: true }),
          supabase.from('events').select('*,event_submission_contacts(contact_name,contact_email,created_at)').order('created_at', { ascending: false }),
        ]).then(([documentResult, noticeResult, meetingResult, eventResult]) => {
          if (!active) return
          if (documentResult.error) setMessage(`Could not load documents: ${documentResult.error.message}`)
          else setDocuments(documentResult.data || [])
          if (noticeResult.error) setMessage('Public notices are not configured yet. Run the public_notices.sql setup script in Supabase.')
          else setNotices(noticeResult.data || [])
          if (meetingResult.error) setMessage('Meeting records are not configured yet. Run the meeting_documents.sql setup script in Supabase.')
          else setMeetingDocuments(meetingResult.data || [])
          if (eventResult.error) setMessage(`Could not load events: ${eventResult.error.message}`)
          else setAdminEvents(eventResult.data || [])
        })
      }
    })
    return () => { active = false }
  }, [session])

  async function loadAdminDocuments() {
    const { data, error } = await supabase.from('county_documents').select('*').order('document_date', { ascending: false }).order('created_at', { ascending: false })
    if (error) setMessage(`Could not load documents: ${error.message}`)
    else setDocuments(data || [])
  }

  async function loadAdminNotices() {
    const { data, error } = await supabase.from('public_notices').select('*').order('updated_at', { ascending: false })
    if (error) setMessage(`Could not load notices: ${error.message}`)
    else setNotices(data || [])
  }

  async function loadAdminMeetingDocuments() {
    const { data, error } = await supabase.from('meeting_documents').select('*').order('meeting_date', { ascending: false }).order('document_type', { ascending: true })
    if (error) setMessage(`Could not load meeting records: ${error.message}`)
    else setMeetingDocuments(data || [])
  }

  async function loadAdminEvents() {
    const { data, error } = await supabase.from('events').select('*,event_submission_contacts(contact_name,contact_email,created_at)').order('created_at', { ascending: false })
    if (error) setMessage(`Could not load events: ${error.message}`)
    else setAdminEvents(data || [])
  }

  const access = !isSupabaseConfigured
    ? 'unconfigured'
    : session === undefined
      ? 'loading'
      : !session
        ? 'signed-out'
        : !accessChecked
          ? 'loading'
          : isAdmin
            ? 'admin'
            : 'denied'

  async function handleSignIn(event) {
    event.preventDefault()
    setBusy(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setAuthError('The email or password was not accepted.')
    setBusy(false)
  }

  async function handleUpload(event) {
    event.preventDefault()
    const uploadForm = event.currentTarget
    if (!file) {
      setMessage('Choose a document to upload.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setMessage('Files must be 25 MB or smaller.')
      return
    }

    setBusy(true)
    setMessage('')
    const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
    const folder = form.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const storagePath = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`
    const mimeType = getDocumentMimeType(file)
    if (!mimeType) {
      setMessage('This file type is not supported.')
      setBusy(false)
      return
    }
    const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(storagePath, file, { contentType: mimeType, upsert: false })

    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`)
      setBusy(false)
      return
    }

    const { error: insertError } = await supabase.from('county_documents').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      document_date: form.document_date,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size: file.size,
      is_published: form.is_published,
      uploaded_by: session.user.id,
    })

    if (insertError) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath])
      setMessage(`The file uploaded, but its record could not be saved: ${insertError.message}`)
      setBusy(false)
      return
    }

    setForm({ title: '', description: '', category: form.category, document_date: new Date().toISOString().slice(0, 10), is_published: true })
    setFile(null)
    uploadForm.reset()
    setMessage('Document uploaded successfully.')
    await loadAdminDocuments()
    setBusy(false)
  }

  function resetNoticeEditor() {
    setNoticeForm(emptyNoticeForm())
    setNoticeFile(null)
    setEditingNotice(null)
  }

  function editNotice(item) {
    setEditingNotice(item)
    setNoticeFile(null)
    setNoticeForm({
      title: item.title || '',
      notice_type: item.notice_type || 'Public notice',
      posted_at: item.posted_at || new Date().toISOString().slice(0, 10),
      summary: item.summary || '',
      body: item.body || '',
      deadline_at: toDateTimeLocal(item.deadline_at),
      expires_at: item.expires_at || '',
      contact_name: item.contact_name || '',
      contact_phone: item.contact_phone || '',
      submission_address: item.submission_address || '',
      action_url: item.action_url || '',
      action_label: item.action_label || '',
      is_featured: Boolean(item.is_featured),
      status: item.status || 'draft',
    })
    setTimeout(() => document.querySelector('.notice-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  async function handleNoticeSubmit(event) {
    event.preventDefault()
    const noticeEditor = event.currentTarget
    if (noticeFile && (noticeFile.size > 25 * 1024 * 1024 || getDocumentMimeType(noticeFile) !== 'application/pdf')) {
      setMessage('Notice attachments must be PDF files no larger than 25 MB.')
      return
    }

    setBusy(true)
    setMessage('')
    let newStoragePath = ''
    let attachmentFields = editingNotice ? {
      attachment_name: editingNotice.attachment_name,
      attachment_path: editingNotice.attachment_path,
      attachment_mime_type: editingNotice.attachment_mime_type,
      attachment_size: editingNotice.attachment_size,
    } : {
      attachment_name: null,
      attachment_path: null,
      attachment_mime_type: null,
      attachment_size: null,
    }

    if (noticeFile) {
      const safeName = noticeFile.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
      newStoragePath = `public-notices/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(newStoragePath, noticeFile, { contentType: 'application/pdf', upsert: false })
      if (uploadError) {
        setMessage(`PDF upload failed: ${uploadError.message}`)
        setBusy(false)
        return
      }
      attachmentFields = {
        attachment_name: noticeFile.name,
        attachment_path: newStoragePath,
        attachment_mime_type: 'application/pdf',
        attachment_size: noticeFile.size,
      }
    }

    const payload = {
      title: noticeForm.title.trim(),
      notice_type: noticeForm.notice_type,
      posted_at: noticeForm.posted_at,
      summary: noticeForm.summary.trim(),
      body: noticeForm.body.trim() || null,
      deadline_at: noticeForm.deadline_at || null,
      expires_at: noticeForm.expires_at || null,
      contact_name: noticeForm.contact_name.trim() || null,
      contact_phone: noticeForm.contact_phone.trim() || null,
      submission_address: noticeForm.submission_address.trim() || null,
      action_url: noticeForm.action_url.trim() || null,
      action_label: noticeForm.action_label.trim() || null,
      is_featured: noticeForm.is_featured,
      status: noticeForm.status,
      published_at: noticeForm.status === 'published' ? (editingNotice?.published_at || new Date().toISOString()) : editingNotice?.published_at || null,
      updated_by: session.user.id,
      ...attachmentFields,
    }

    const result = editingNotice
      ? await supabase.from('public_notices').update(payload).eq('id', editingNotice.id)
      : await supabase.from('public_notices').insert({ ...payload, slug: slugify(noticeForm.title), created_by: session.user.id })

    if (result.error) {
      if (newStoragePath) await supabase.storage.from(DOCUMENT_BUCKET).remove([newStoragePath])
      setMessage(`Could not save the notice: ${result.error.message}`)
      setBusy(false)
      return
    }

    if (newStoragePath && editingNotice?.attachment_path) await supabase.storage.from(DOCUMENT_BUCKET).remove([editingNotice.attachment_path])
    setMessage(editingNotice ? 'Notice updated successfully.' : 'Notice created successfully.')
    resetNoticeEditor()
    noticeEditor.reset()
    await loadAdminNotices()
    setBusy(false)
  }

  async function setNoticeStatus(item, status) {
    setMessage('')
    const changes = { status, updated_by: session.user.id }
    if (status === 'published' && !item.published_at) changes.published_at = new Date().toISOString()
    const { error } = await supabase.from('public_notices').update(changes).eq('id', item.id)
    if (error) setMessage(`Could not update the notice: ${error.message}`)
    else {
      setMessage(status === 'archived' ? 'Notice archived.' : status === 'published' ? 'Notice published.' : 'Notice moved to drafts.')
      await loadAdminNotices()
    }
  }

  async function deletePublicNotice(item) {
    if (!window.confirm(`Delete “${item.title}”? This permanently removes the notice${item.attachment_path ? ' and its PDF' : ''}.`)) return
    setMessage('')
    const { error } = await supabase.from('public_notices').delete().eq('id', item.id)
    if (error) {
      setMessage(`Could not delete the notice: ${error.message}`)
      return
    }
    if (item.attachment_path) await supabase.storage.from(DOCUMENT_BUCKET).remove([item.attachment_path])
    if (editingNotice?.id === item.id) resetNoticeEditor()
    setMessage('Notice deleted.')
    await loadAdminNotices()
  }

  function resetMeetingEditor() {
    setMeetingForm(emptyMeetingForm())
    setMeetingFile(null)
    setEditingMeeting(null)
  }

  function editMeetingDocument(item) {
    setEditingMeeting(item)
    setMeetingFile(null)
    setMeetingForm({
      title: item.title || '',
      meeting_date: item.meeting_date,
      meeting_type: item.meeting_type || 'Regular Meeting',
      document_type: item.document_type || 'Agenda',
      is_published: Boolean(item.is_published),
    })
    setTimeout(() => document.querySelector('.meeting-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  async function handleMeetingSubmit(event) {
    event.preventDefault()
    const meetingEditor = event.currentTarget
    if (!editingMeeting && !meetingFile) {
      setMessage('Choose a PDF agenda or minutes file.')
      return
    }
    if (meetingFile && (meetingFile.size > 25 * 1024 * 1024 || getDocumentMimeType(meetingFile) !== 'application/pdf')) {
      setMessage('Meeting records must be PDF files no larger than 25 MB.')
      return
    }

    setBusy(true)
    setMessage('')
    let newStoragePath = ''
    let fileFields = editingMeeting ? {
      file_name: editingMeeting.file_name,
      storage_path: editingMeeting.storage_path,
      mime_type: editingMeeting.mime_type,
      file_size: editingMeeting.file_size,
    } : { file_name: null, storage_path: null, mime_type: null, file_size: null }

    if (meetingFile) {
      const safeName = meetingFile.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
      newStoragePath = `meeting-records/${meetingForm.meeting_date.slice(0, 4)}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(newStoragePath, meetingFile, { contentType: 'application/pdf', upsert: false })
      if (uploadError) {
        setMessage(`PDF upload failed: ${uploadError.message}`)
        setBusy(false)
        return
      }
      fileFields = { file_name: meetingFile.name, storage_path: newStoragePath, mime_type: 'application/pdf', file_size: meetingFile.size }
    }

    const payload = {
      title: meetingForm.title.trim() || `${formatDocumentDate(meetingForm.meeting_date)} ${meetingForm.meeting_type}`,
      meeting_date: meetingForm.meeting_date,
      meeting_type: meetingForm.meeting_type,
      document_type: meetingForm.document_type,
      is_published: meetingForm.is_published,
      uploaded_by: session.user.id,
      ...fileFields,
    }
    const result = editingMeeting
      ? await supabase.from('meeting_documents').update(payload).eq('id', editingMeeting.id)
      : await supabase.from('meeting_documents').insert(payload)

    if (result.error) {
      if (newStoragePath) await supabase.storage.from(DOCUMENT_BUCKET).remove([newStoragePath])
      setMessage(`Could not save the meeting record: ${result.error.message}`)
      setBusy(false)
      return
    }

    if (newStoragePath && editingMeeting?.storage_path) await supabase.storage.from(DOCUMENT_BUCKET).remove([editingMeeting.storage_path])
    setMessage(editingMeeting ? 'Meeting record updated.' : 'Meeting record uploaded.')
    resetMeetingEditor()
    meetingEditor.reset()
    await loadAdminMeetingDocuments()
    setBusy(false)
  }

  async function toggleMeetingPublished(item) {
    setMessage('')
    const { error } = await supabase.from('meeting_documents').update({ is_published: !item.is_published, uploaded_by: session.user.id }).eq('id', item.id)
    if (error) setMessage(`Could not update the meeting record: ${error.message}`)
    else {
      setMessage(item.is_published ? 'Meeting record unpublished.' : 'Meeting record published.')
      await loadAdminMeetingDocuments()
    }
  }

  async function deleteMeetingDocument(item) {
    if (!window.confirm(`Delete “${item.title}” ${item.document_type.toLowerCase()}? This cannot be undone.`)) return
    setMessage('')
    const { error } = await supabase.from('meeting_documents').delete().eq('id', item.id)
    if (error) {
      setMessage(`Could not delete the meeting record: ${error.message}`)
      return
    }
    if (item.storage_path) await supabase.storage.from(DOCUMENT_BUCKET).remove([item.storage_path])
    if (editingMeeting?.id === item.id) resetMeetingEditor()
    setMessage('Meeting record deleted.')
    await loadAdminMeetingDocuments()
  }

  function resetAdminEventEditor() {
    setEditingAdminEvent(null)
    setEventForm(emptyAdminEventForm())
  }

  function editAdminEvent(item) {
    setEditingAdminEvent(item)
    setEventForm(adminEventFormFromRecord(item))
    setMessage('')
    setTimeout(() => document.querySelector('.event-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  async function handleAdminEventSubmit(event) {
    event.preventDefault()
    if (!editingAdminEvent) return

    let eventDetails
    try {
      eventDetails = prepareEventPayload(eventForm)
    } catch (formError) {
      setMessage(formError.message)
      return
    }

    setBusy(true)
    setMessage('')
    const payload = {
      title: eventDetails.title,
      description: eventDetails.description,
      start_at: eventDetails.startAt,
      end_at: eventDetails.endAt,
      all_day: eventDetails.allDay,
      location_name: eventDetails.locationName,
      address: eventDetails.address,
      website_url: eventDetails.websiteUrl,
      category: eventDetails.category,
      status: eventForm.status,
      is_published: eventForm.status === 'approved' && eventForm.isPublished,
    }
    const { error } = await supabase.from('events').update(payload).eq('id', editingAdminEvent.id)
    if (error) setMessage(`Could not save the event: ${error.message}`)
    else {
      setMessage(eventForm.status === 'approved' && eventForm.isPublished ? 'Event updated and published.' : 'Event updated successfully.')
      resetAdminEventEditor()
      await loadAdminEvents()
    }
    setBusy(false)
  }

  async function reviewAdminEvent(item, status) {
    setBusy(true)
    setMessage('')
    const approved = status === 'approved'
    const { error } = await supabase.from('events').update({
      status,
      is_published: approved,
    }).eq('id', item.id)
    if (error) setMessage(`Could not ${approved ? 'approve' : 'reject'} the event: ${error.message}`)
    else {
      if (editingAdminEvent?.id === item.id) resetAdminEventEditor()
      setMessage(approved ? 'Event approved and published.' : 'Event rejected and removed from the public calendar.')
      await loadAdminEvents()
    }
    setBusy(false)
  }

  async function invokeAdobeAutoTag(body) {
    const { data, error } = await supabase.functions.invoke('adobe-autotag', { body })
    if (error) {
      let functionMessage = ''
      try {
        const responseBody = await error.context?.clone?.().json()
        functionMessage = responseBody?.error || ''
      } catch {
        // Use the Supabase client error when the function response has no JSON body.
      }
      throw new Error(functionMessage || error.message || 'The Adobe Auto-Tag function could not be reached.')
    }
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function autoTagPdf(storagePath, title, reloadDocuments) {
    if (!window.confirm(`Auto-tag and check “${title}” with Adobe? The tagged PDF will replace the current stored file.`)) return

    setTaggingPath(storagePath)
    setReportDownloads([])
    setAccessibilityReport(null)
    setMessage(`Uploading “${title}” to Adobe Auto-Tag…`)

    try {
      const job = await invokeAdobeAutoTag({
        action: 'start',
        sourcePath: storagePath,
        generateReport: true,
      })
      let waitedSeconds = 0
      let result = job

      while (result.status !== 'done') {
        if (waitedSeconds >= 10 * 60) throw new Error('Adobe is still processing this PDF. Try Auto-tag & check again in a few minutes.')
        const waitSeconds = Math.min(Math.max(1, Math.min(Number(result.retryAfter) || 3, 15)), 10 * 60 - waitedSeconds)
        waitedSeconds += waitSeconds
        setMessage(`Adobe is auto-tagging “${title}”…`)
        await new Promise((resolve) => window.setTimeout(resolve, waitSeconds * 1000))
        result = await invokeAdobeAutoTag({
          action: 'status',
          pollingUrl: job.pollingUrl,
          outputPath: job.outputPath,
          reportPath: job.reportPath,
          generateReport: job.generateReport,
        })
      }

      await reloadDocuments()
      const downloads = result.reportSignedUrl
        ? [{ url: result.reportSignedUrl, label: 'Download tagging report (XLSX)' }]
        : []

      try {
        setMessage(`“${title}” is tagged. Adobe is now running the automated accessibility checks…`)
        const checkerJob = await invokeAdobeAutoTag({
          action: 'checker-start',
          sourcePath: result.outputPath,
        })
        let checkerResult = checkerJob
        waitedSeconds = 0

        while (checkerResult.status !== 'done') {
          if (waitedSeconds >= 10 * 60) throw new Error('Adobe is still checking this PDF. Run Auto-tag & check again in a few minutes.')
          const waitSeconds = Math.min(Math.max(1, Math.min(Number(checkerResult.retryAfter) || 3, 15)), 10 * 60 - waitedSeconds)
          waitedSeconds += waitSeconds
          await new Promise((resolve) => window.setTimeout(resolve, waitSeconds * 1000))
          checkerResult = await invokeAdobeAutoTag({
            action: 'checker-status',
            pollingUrl: checkerJob.pollingUrl,
            sourcePath: checkerJob.sourcePath,
            reportPath: checkerJob.reportPath,
          })
        }

        const summary = checkerResult.summary || {}
        const failed = Number(summary.failed) || 0
        const passed = Number(summary.passed) || 0
        const manual = Number(summary.needsManualCheck) || 0
        const completedMessage = failed > 0
          ? `“${title}” is tagged. Adobe’s automated check found ${failed} item${failed === 1 ? '' : 's'} needing correction; ${passed} passed and ${manual} need manual review.`
          : `“${title}” is tagged. All ${passed} automated checks passed; ${manual} item${manual === 1 ? '' : 's'} still need manual review.`
        if (checkerResult.reportSignedUrl) downloads.push({ url: checkerResult.reportSignedUrl, label: 'Download accessibility check (JSON)' })
        setMessage(completedMessage)
        setReportDownloads(downloads.map((download) => ({ ...download, message: completedMessage })))
        setAccessibilityReport({
          title,
          summary,
          sections: Array.isArray(checkerResult.sections) ? checkerResult.sections : [],
          message: completedMessage,
        })
      } catch (checkerError) {
        const completedMessage = `“${title}” was auto-tagged, but its automated accessibility check failed: ${checkerError instanceof Error ? checkerError.message : 'Unexpected error.'}`
        setMessage(completedMessage)
        setReportDownloads(downloads.map((download) => ({ ...download, message: completedMessage })))
      }
    } catch (error) {
      setMessage(`Auto-tagging failed: ${error instanceof Error ? error.message : 'Unexpected error.'}`)
    } finally {
      setTaggingPath('')
    }
  }

  async function togglePublished(document) {
    setMessage('')
    const { error } = await supabase.from('county_documents').update({ is_published: !document.is_published }).eq('id', document.id)
    if (error) setMessage(`Could not update the document: ${error.message}`)
    else {
      setMessage(document.is_published ? 'Document unpublished.' : 'Document published.')
      await loadAdminDocuments()
    }
  }

  async function deleteDocument(document) {
    if (!window.confirm(`Delete “${document.title}”? This permanently removes the file.`)) return
    setMessage('')
    const { error: storageError } = await supabase.storage.from(DOCUMENT_BUCKET).remove([document.storage_path])
    if (storageError) {
      setMessage(`Could not remove the file: ${storageError.message}`)
      return
    }
    const { error } = await supabase.from('county_documents').delete().eq('id', document.id)
    if (error) setMessage(`The file was removed, but the document record could not be deleted: ${error.message}`)
    else {
      setMessage('Document deleted.')
      await loadAdminDocuments()
    }
  }

  const adminPage = { navTitle: 'Administration', eyebrow: 'Secure County Administration', title: 'Content Administration', intro: 'Review submitted events and maintain public notices, meeting records, and county documents from one secure workspace.' }
  const preview = previewNotice === 'form' ? { ...noticeForm, id: 'form-preview' } : previewNotice
  const adminYearMeetingDocuments = meetingDocuments.filter((item) => item.meeting_date?.startsWith(adminMeetingYear))
  const pendingEventCount = adminEvents.filter((item) => item.status === 'pending').length
  const normalizedAdminEventSearch = adminEventSearch.trim().toLowerCase()
  const visibleAdminEvents = adminEvents
    .filter((item) => adminEventStatus === 'all' || item.status === adminEventStatus)
    .filter((item) => !normalizedAdminEventSearch || [item.title, item.description, item.category, item.location_name, item.address]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedAdminEventSearch))
    .sort((first, second) => {
      const statusOrder = { pending: 0, approved: 1, rejected: 2 }
      const statusDifference = (statusOrder[first.status] ?? 3) - (statusOrder[second.status] ?? 3)
      if (statusDifference) return statusDifference
      return new Date(first.start_at).getTime() - new Date(second.start_at).getTime()
    })

  return (
    <main id="main-content" className="interior-page admin-page">
      <PageHero page={adminPage} />
      <section className="section admin-section">
        <div className="container">
          {access === 'loading' && <div className="admin-auth-card"><p>Checking administrator access…</p></div>}
          {access === 'unconfigured' && <div className="admin-auth-card"><h2>Supabase connection required</h2><p>Add the Lee County Supabase project URL and publishable key to the website environment.</p></div>}
          {access === 'signed-out' && <form className="admin-auth-card" onSubmit={handleSignIn}><p className="eyebrow">Administrator Sign In</p><h2>Welcome back</h2><p>Sign in with an approved Lee County administrator account.</p><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{authError && <p className="admin-message error" role="alert">{authError}</p>}<button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form>}
          {access === 'denied' && <div className="admin-auth-card"><h2>Administrator access required</h2><p>This account is signed in but is not listed as an approved Lee County administrator.</p><button type="button" onClick={() => supabase.auth.signOut()}>Sign out</button></div>}
          {access === 'admin' && <div className="admin-dashboard">
            <div className="admin-toolbar"><div><p className="eyebrow">County Content</p><h2>Manage public content</h2><p>Signed in as {session.user.email}</p></div><button type="button" className="button-quiet" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
            <div className="admin-tabs" role="tablist" aria-label="Content type"><button type="button" role="tab" aria-selected={adminView === 'events'} onClick={() => setAdminView('events')}>Events <span title="Pending approval">{pendingEventCount}</span></button><button type="button" role="tab" aria-selected={adminView === 'notices'} onClick={() => setAdminView('notices')}>Public notices <span>{notices.length}</span></button><button type="button" role="tab" aria-selected={adminView === 'meetings'} onClick={() => setAdminView('meetings')}>Meetings <span>{meetingDocuments.length}</span></button><button type="button" role="tab" aria-selected={adminView === 'documents'} onClick={() => setAdminView('documents')}>Document library <span>{documents.length}</span></button></div>
            {message && <div className="admin-message" role="status"><p>{message}</p>{reportDownloads.some((report) => report.message === message) && <div className="admin-report-links">{reportDownloads.filter((report) => report.message === message).map((report) => <a href={report.url} target="_blank" rel="noreferrer" download key={report.label}>{report.label}</a>)}</div>}</div>}
            {accessibilityReport?.message === message && <details className="admin-accessibility-results"><summary>View accessibility check results</summary><div className="admin-accessibility-results-body"><div className="admin-accessibility-results-heading"><div><p className="eyebrow">Adobe Accessibility Checker</p><h3>{accessibilityReport.title}</h3></div><p>Automated checks identify technical issues. Rules marked for manual review still require a person to verify the document.</p></div><div className="admin-accessibility-summary" aria-label="Accessibility check summary"><div className="passed"><strong>{accessibilityReport.summary.passed || 0}</strong><span>Passed</span></div><div className="failed"><strong>{accessibilityReport.summary.failed || 0}</strong><span>Failed</span></div><div className="manual"><strong>{accessibilityReport.summary.needsManualCheck || 0}</strong><span>Manual review</span></div></div><div className="admin-accessibility-sections">{accessibilityReport.sections.map((section) => <section key={section.category}><h4>{section.category}</h4><ul>{section.rules.map((rule, index) => { const statusClass = rule.status === 'Passed' ? 'passed' : rule.status === 'Failed' ? 'failed' : 'manual'; return <li key={`${rule.name}-${index}`}><span className={`accessibility-rule-status ${statusClass}`}>{rule.status}</span><div><strong>{rule.name}</strong>{rule.description && <p>{rule.description}</p>}</div></li> })}</ul></section>)}</div></div></details>}

            {adminView === 'events' && <div className="admin-layout event-admin-layout">
              {editingAdminEvent ? <form className="document-upload-form event-editor" onSubmit={handleAdminEventSubmit}>
                <div><p className="eyebrow">Edit Event</p><h3>Review event details</h3><small className="event-editor-note">Times are shown in Eastern Time.</small></div>
                <label>Event title<input type="text" value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} maxLength="120" required /></label>
                <label>Category<select value={eventForm.category} onChange={(event) => setEventForm({ ...eventForm, category: event.target.value })}>{EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>Description<textarea value={eventForm.description} onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} maxLength="4000" rows="5" /></label>
                <label className="publish-check"><input type="checkbox" checked={eventForm.allDay} onChange={(event) => setEventForm({ ...eventForm, allDay: event.target.checked, startTime: event.target.checked ? '' : eventForm.startTime, endTime: event.target.checked ? '' : eventForm.endTime })} /> All-day event</label>
                <div className="admin-field-grid"><label>Start date<input type="date" value={eventForm.startDate} onChange={(event) => setEventForm({ ...eventForm, startDate: event.target.value })} required /></label>{!eventForm.allDay && <label>Start time<input type="time" value={eventForm.startTime} onChange={(event) => setEventForm({ ...eventForm, startTime: event.target.value })} required /></label>}</div>
                <div className="admin-field-grid"><label>End date <span className="optional-label">Optional</span><input type="date" value={eventForm.endDate} onChange={(event) => setEventForm({ ...eventForm, endDate: event.target.value })} /></label>{!eventForm.allDay && <label>End time <span className="optional-label">Optional</span><input type="time" value={eventForm.endTime} onChange={(event) => setEventForm({ ...eventForm, endTime: event.target.value })} /></label>}</div>
                <div className="admin-field-grid"><label>Venue<input type="text" value={eventForm.locationName} onChange={(event) => setEventForm({ ...eventForm, locationName: event.target.value })} maxLength="160" /></label><label>Address<input type="text" value={eventForm.address} onChange={(event) => setEventForm({ ...eventForm, address: event.target.value })} maxLength="240" /></label></div>
                <label>Event website<input type="url" value={eventForm.websiteUrl} onChange={(event) => setEventForm({ ...eventForm, websiteUrl: event.target.value })} maxLength="500" placeholder="https://" /></label>
                <div className="admin-field-grid"><label>Review status<select value={eventForm.status} onChange={(event) => setEventForm({ ...eventForm, status: event.target.value, isPublished: event.target.value === 'approved' })}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><label className="publish-check"><input type="checkbox" checked={eventForm.isPublished} disabled={eventForm.status !== 'approved'} onChange={(event) => setEventForm({ ...eventForm, isPublished: event.target.checked })} /> Show on public calendar</label></div>
                <div className="notice-form-actions"><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save event'}</button><button type="button" className="button-secondary" onClick={resetAdminEventEditor}>Cancel edit</button></div>
              </form> : <div className="document-upload-form event-editor-empty"><span className="event-editor-icon"><Icon name="calendar" size={28} /></span><p className="eyebrow">Event Review</p><h3>Select an event to edit</h3><p>Choose Edit beside a submission to correct its title, schedule, location, category, description, or publication status.</p></div>}
              <div className="admin-document-list admin-event-list">
                <div className="admin-list-heading event-list-heading"><div><h3>Event submissions</h3><small>{pendingEventCount} pending · {adminEvents.length} total</small></div><span>{visibleAdminEvents.length}</span></div>
                <div className="admin-event-filters"><label><span>Search</span><input type="search" value={adminEventSearch} onChange={(event) => setAdminEventSearch(event.target.value)} placeholder="Event or location" /></label><label><span>Status</span><select value={adminEventStatus} onChange={(event) => setAdminEventStatus(event.target.value)}><option value="pending">Pending approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All events</option></select></label></div>
                {visibleAdminEvents.length === 0 ? <div className="admin-empty">No events match these filters.</div> : visibleAdminEvents.map((item) => <article key={item.id}><div><span className={`status ${item.status || 'pending'}`}>{item.status || 'pending'}</span>{item.is_published && <span className="status event-live-status">Live</span>}<p>{formatAdminEventSchedule(item)}</p><h4>{item.title}</h4><small>{item.category || 'Community'}{item.location_name ? ` · ${item.location_name}` : ''}{item.created_at ? ` · Submitted ${formatDocumentDate(item.created_at.slice(0, 10))}` : ''}</small>{adminEventContact(item) && <small className="event-submitter">Submitted by {adminEventContact(item).contact_name} · <a href={`mailto:${adminEventContact(item).contact_email}`}>{adminEventContact(item).contact_email}</a></small>}</div><div className="admin-document-actions"><button type="button" disabled={busy} onClick={() => editAdminEvent(item)}>Edit</button>{item.status !== 'approved' && <button type="button" className="approve" disabled={busy} onClick={() => reviewAdminEvent(item, 'approved')}>Approve</button>}{item.status !== 'rejected' && <button type="button" className="reject" disabled={busy} onClick={() => reviewAdminEvent(item, 'rejected')}>Reject</button>}</div></article>)}
              </div>
            </div>}

            {adminView === 'notices' && <div className="admin-layout notice-admin-layout">
              <form className="document-upload-form notice-editor" onSubmit={handleNoticeSubmit}>
                <div><p className="eyebrow">{editingNotice ? 'Edit Notice' : 'New Notice'}</p><h3>{editingNotice ? 'Update public notice' : 'Create public notice'}</h3></div>
                <label>Notice title<input type="text" value={noticeForm.title} onChange={(event) => setNoticeForm({ ...noticeForm, title: event.target.value })} maxLength="180" required /></label>
                <div className="admin-field-grid"><label>Notice type<select value={noticeForm.notice_type} onChange={(event) => setNoticeForm({ ...noticeForm, notice_type: event.target.value })}>{noticeTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Posted date<input type="date" value={noticeForm.posted_at} onChange={(event) => setNoticeForm({ ...noticeForm, posted_at: event.target.value })} required /></label></div>
                <label>Short summary<textarea value={noticeForm.summary} onChange={(event) => setNoticeForm({ ...noticeForm, summary: event.target.value })} maxLength="1200" rows="4" required /></label>
                <label>Full details<textarea value={noticeForm.body} onChange={(event) => setNoticeForm({ ...noticeForm, body: event.target.value })} maxLength="10000" rows="6" /></label>
                <div className="admin-field-grid"><label>Deadline (Eastern)<input type="datetime-local" value={noticeForm.deadline_at} onChange={(event) => setNoticeForm({ ...noticeForm, deadline_at: event.target.value })} /></label><label>Archive after<input type="date" value={noticeForm.expires_at} onChange={(event) => setNoticeForm({ ...noticeForm, expires_at: event.target.value })} /></label></div>
                <div className="admin-field-grid"><label>Contact name<input type="text" value={noticeForm.contact_name} onChange={(event) => setNoticeForm({ ...noticeForm, contact_name: event.target.value })} maxLength="180" /></label><label>Contact phone<input type="tel" value={noticeForm.contact_phone} onChange={(event) => setNoticeForm({ ...noticeForm, contact_phone: event.target.value })} maxLength="40" /></label></div>
                <label>Submission address<textarea value={noticeForm.submission_address} onChange={(event) => setNoticeForm({ ...noticeForm, submission_address: event.target.value })} maxLength="500" rows="3" /></label>
                <div className="admin-field-grid"><label>External link<input type="url" value={noticeForm.action_url} onChange={(event) => setNoticeForm({ ...noticeForm, action_url: event.target.value })} placeholder="https://" /></label><label>Button label<input type="text" value={noticeForm.action_label} onChange={(event) => setNoticeForm({ ...noticeForm, action_label: event.target.value })} maxLength="80" placeholder="Learn more" /></label></div>
                <label className="file-field">{editingNotice?.attachment_path ? 'Replace PDF attachment' : 'PDF attachment'}<input type="file" accept="application/pdf,.pdf" onChange={(event) => setNoticeFile(event.target.files?.[0] || null)} /><span>{editingNotice?.attachment_name ? `Current: ${editingNotice.attachment_name}. Choose a file only to replace it.` : 'Optional · PDF only · 25 MB maximum'}</span></label>
                <div className="admin-field-grid"><label>Status<select value={noticeForm.status} onChange={(event) => setNoticeForm({ ...noticeForm, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="publish-check"><input type="checkbox" checked={noticeForm.is_featured} onChange={(event) => setNoticeForm({ ...noticeForm, is_featured: event.target.checked })} /> Feature this notice</label></div>
                <div className="notice-form-actions"><button type="submit" disabled={busy}>{busy ? 'Saving…' : editingNotice ? 'Save changes' : 'Create notice'}</button><button type="button" className="button-secondary" onClick={() => setPreviewNotice('form')}>Preview</button>{editingNotice && <button type="button" className="button-secondary" onClick={resetNoticeEditor}>Cancel edit</button>}</div>
              </form>
              <div className="admin-document-list admin-notice-list"><div className="admin-list-heading"><h3>All public notices</h3><span>{notices.length}</span></div>{notices.length === 0 ? <div className="admin-empty">No notices have been created.</div> : notices.map((item) => <article key={item.id}><div><span className={`status ${item.status}`}>{item.status}</span>{item.is_featured && <span className="status featured">Featured</span>}<p>{item.notice_type} · {formatDocumentDate(item.posted_at)}</p><h4>{item.title}</h4><small>{item.attachment_name ? `${item.attachment_name} · ${formatFileSize(item.attachment_size)}` : 'No PDF attachment'}{item.expires_at ? ` · Archives ${formatDocumentDate(item.expires_at)}` : ''}</small></div><div className="admin-document-actions"><button type="button" onClick={() => editNotice(item)}>Edit</button><button type="button" onClick={() => setPreviewNotice(item)}>Preview</button><button type="button" onClick={() => setNoticeStatus(item, item.status === 'published' ? 'draft' : 'published')}>{item.status === 'published' ? 'Unpublish' : 'Publish'}</button>{item.status !== 'archived' && <button type="button" onClick={() => setNoticeStatus(item, 'archived')}>Archive</button>}{item.attachment_path && <button type="button" disabled={Boolean(taggingPath)} onClick={() => autoTagPdf(item.attachment_path, item.title, loadAdminNotices)}>{taggingPath === item.attachment_path ? 'Processing…' : 'Auto-tag & check'}</button>}<button type="button" className="danger" onClick={() => deletePublicNotice(item)}>Delete</button></div></article>)}</div>
            </div>}

            {adminView === 'meetings' && <div className="admin-layout meeting-admin-layout">
              <form className="document-upload-form meeting-editor" onSubmit={handleMeetingSubmit}>
                <div><p className="eyebrow">{editingMeeting ? 'Edit Record' : 'New Meeting Record'}</p><h3>{editingMeeting ? 'Update meeting file' : 'Upload agenda or minutes'}</h3></div>
                <label>Meeting date<input type="date" value={meetingForm.meeting_date} onChange={(event) => setMeetingForm({ ...meetingForm, meeting_date: event.target.value })} min={getPublicRecordRetentionCutoff()} required /></label>
                <div className="admin-field-grid"><label>Meeting type<select value={meetingForm.meeting_type} onChange={(event) => setMeetingForm({ ...meetingForm, meeting_type: event.target.value })}>{!meetingTypes.includes(meetingForm.meeting_type) && <option>{meetingForm.meeting_type}</option>}{meetingTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Document type<select value={meetingForm.document_type} onChange={(event) => setMeetingForm({ ...meetingForm, document_type: event.target.value })}><option>Agenda</option><option>Minutes</option></select></label></div>
                <label>Display title <span className="optional-label">Optional</span><input type="text" value={meetingForm.title} onChange={(event) => setMeetingForm({ ...meetingForm, title: event.target.value })} maxLength="180" placeholder="Generated from the date and meeting type" /></label>
                <label className="file-field">{editingMeeting?.storage_path || editingMeeting?.external_url ? 'Replace PDF' : 'PDF file'}<input type="file" accept="application/pdf,.pdf" onChange={(event) => setMeetingFile(event.target.files?.[0] || null)} required={!editingMeeting} /><span>{editingMeeting ? `Current source: ${editingMeeting.file_name || 'legacy county website link'}. Choose a file only to replace it.` : 'PDF only · 25 MB maximum'}</span></label>
                <label className="publish-check"><input type="checkbox" checked={meetingForm.is_published} onChange={(event) => setMeetingForm({ ...meetingForm, is_published: event.target.checked })} /> Publish immediately</label>
                <div className="notice-form-actions"><button type="submit" disabled={busy}>{busy ? 'Saving…' : editingMeeting ? 'Save changes' : 'Upload record'}</button>{editingMeeting && <button type="button" className="button-secondary" onClick={resetMeetingEditor}>Cancel edit</button>}</div>
              </form>
              <div className="admin-document-list admin-meeting-list"><div className="admin-list-heading admin-meeting-heading"><div><h3>Meeting records</h3><small>{adminYearMeetingDocuments.length} files</small></div><select aria-label="Filter meeting records by year" value={adminMeetingYear} onChange={(event) => setAdminMeetingYear(event.target.value)}>{meetingYears.map((item) => <option key={item}>{item}</option>)}</select></div>{adminYearMeetingDocuments.length === 0 ? <div className="admin-empty">No meeting records for {adminMeetingYear}.</div> : adminYearMeetingDocuments.map((item) => <article key={item.id}><div><span className={item.is_published ? 'status published' : 'status draft'}>{item.is_published ? 'Published' : 'Draft'}</span><span className="status meeting-document-status">{item.document_type}</span><p>{formatDocumentDate(item.meeting_date)} · {item.meeting_type}</p><h4>{item.title}</h4><small>{item.file_name ? `${item.file_name} · ${formatFileSize(item.file_size)}` : 'Legacy county website link'}</small></div><div className="admin-document-actions"><button type="button" onClick={() => editMeetingDocument(item)}>Edit</button><button type="button" onClick={() => toggleMeetingPublished(item)}>{item.is_published ? 'Unpublish' : 'Publish'}</button>{item.storage_path && <button type="button" disabled={Boolean(taggingPath)} onClick={() => autoTagPdf(item.storage_path, item.title, loadAdminMeetingDocuments)}>{taggingPath === item.storage_path ? 'Processing…' : 'Auto-tag & check'}</button>}<button type="button" className="danger" onClick={() => deleteMeetingDocument(item)}>Delete</button></div></article>)}</div>
            </div>}

            {adminView === 'documents' && <div className="admin-layout">
              <form className="document-upload-form" onSubmit={handleUpload}>
                <div><p className="eyebrow">New Document</p><h3>Upload a file</h3></div>
                <label>Document title<input type="text" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength="180" required /></label>
                <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{documentCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>Document date<input type="date" value={form.document_date} onChange={(event) => setForm({ ...form, document_date: event.target.value })} required /></label>
                <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength="2000" rows="4" /></label>
                <label className="file-field">File<input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp" onChange={(event) => setFile(event.target.files?.[0] || null)} required /><span>PDF, Office, spreadsheet, text, or image · 25 MB maximum</span></label>
                <label className="publish-check"><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} /> Publish immediately</label>
                <button type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Upload document'}</button>
              </form>
              <div className="admin-document-list"><div className="admin-list-heading"><h3>All documents</h3><span>{documents.length}</span></div>{documents.length === 0 ? <div className="admin-empty">No documents have been uploaded.</div> : documents.map((document) => <article key={document.id}><div><span className={document.is_published ? 'status published' : 'status draft'}>{document.is_published ? 'Published' : 'Draft'}</span><p>{document.category} · {formatDocumentDate(document.document_date)}</p><h4>{document.title}</h4><small>{document.file_name} · {formatFileSize(document.file_size)}</small></div><div className="admin-document-actions"><button type="button" onClick={() => togglePublished(document)}>{document.is_published ? 'Unpublish' : 'Publish'}</button>{document.storage_path?.toLowerCase().endsWith('.pdf') && <button type="button" disabled={Boolean(taggingPath)} onClick={() => autoTagPdf(document.storage_path, document.title, loadAdminDocuments)}>{taggingPath === document.storage_path ? 'Processing…' : 'Auto-tag & check'}</button>}<button type="button" className="danger" onClick={() => deleteDocument(document)}>Delete</button></div></article>)}</div>
            </div>}
          </div>}
        </div>
      </section>

      {preview && <div className="notice-preview-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewNotice(null) }}><section className="notice-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="notice-preview-title"><div className="notice-preview-header"><div><p className="eyebrow">Staff preview</p><h2 id="notice-preview-title">Public notice preview</h2></div><button type="button" onClick={() => setPreviewNotice(null)} aria-label="Close preview">×</button></div><article className={`notice-card${preview.is_featured ? ' notice-card-featured' : ''}`}><div className="notice-card-topline"><span className="notice-card-icon"><Icon name={noticeIcon(preview)} size={25} /></span><span className="notice-type">{preview.notice_type}</span>{preview.posted_at && <time>{formatDocumentDate(preview.posted_at)}</time>}</div><h3>{preview.title || 'Untitled notice'}</h3><p className="notice-summary">{preview.summary || 'The notice summary will appear here.'}</p>{preview.body && <p>{preview.body}</p>}{(preview.deadline_at || preview.contact_name || preview.submission_address) && <dl className="notice-facts">{preview.deadline_at && <div><dt>Deadline</dt><dd>{formatNoticeDeadline(preview.deadline_at)}</dd></div>}{(preview.contact_name || preview.contact_phone) && <div><dt>Contact</dt><dd>{preview.contact_name}<br />{preview.contact_phone}</dd></div>}{preview.submission_address && <div><dt>Submit to</dt><dd>{preview.submission_address}</dd></div>}</dl>}{(preview.action_url || preview.attachment_path || noticeFile) && <span className="notice-action">{preview.action_label || (preview.attachment_path || noticeFile ? 'Download attachment' : 'Learn more')}<Icon name="external" size={18} /></span>}</article></section></div>}
    </main>
  )
}

function CountyAdministrationPage({ page }) {
  return (
    <main id="main-content" className="interior-page county-administration-page">
      <PageHero page={page} />

      <section className="section county-office-overview" aria-labelledby="county-office-overview-title">
        <div className="container county-office-overview-grid">
          <div className="county-office-copy">
            <p className="eyebrow">Office of the County Administrator</p>
            <h2 id="county-office-overview-title">Turning county policy into public service</h2>
            <p>The County Administrator is appointed by the Lee County Board of Supervisors to serve as the County’s Chief Administrative Officer and as Clerk to the Board.</p>
            <p>The office carries out the day-to-day operations of Lee County government, supervises county staff, implements policies established by the Board, and works with local agencies and community partners to provide services to Lee County citizens.</p>
            <div className="county-office-callout"><Icon name="people" size={27} /><p><strong>Working with the Board of Supervisors</strong><span>The Administrator helps coordinate Board business, supports implementation of Board decisions, and connects county departments with the priorities established by elected leadership.</span></p></div>
          </div>

          <aside className="county-office-contact" aria-label="County Administration contact information">
            <p className="eyebrow light">Visit or contact the office</p>
            <h2>County Administration</h2>
            <div className="county-office-contact-row"><span><Icon name="pin" size={21} /></span><address>Lee County Courthouse<br />Room 111<br />33640 Main Street<br />P.O. Box 367<br />Jonesville, VA 24263</address></div>
            <div className="county-office-contact-row"><span><Icon name="clock" size={21} /></span><p><strong>Office hours</strong><br />8:00 AM–4:30 PM<br />Monday–Friday</p></div>
            <div className="county-office-contact-actions"><a href="tel:2763467714"><Icon name="phone" size={18} /><span>Call the office<small>(276) 346-7714</small></span></a><div><Icon name="form" size={18} /><span>Fax<small>(276) 346-7712</small></span></div></div>
          </aside>
        </div>
      </section>

      <section className="section county-office-leadership" aria-labelledby="county-office-leadership-title">
        <div className="container">
          <div className="county-office-section-heading"><div><p className="eyebrow">Administration team</p><h2 id="county-office-leadership-title">Here to help Lee County</h2></div><p>Contact the County Administration team with questions about county operations, Board business, or the appropriate office for a county service.</p></div>
          <div className="county-office-staff-grid">
            <article><span className="county-office-initials" aria-hidden="true">CC</span><div><p>County Administrator</p><h3>Clint Carter</h3><a href="mailto:ccarter@leecova.org">ccarter@leecova.org <Icon name="arrow" size={16} /></a></div></article>
            <article><span className="county-office-initials" aria-hidden="true">AT</span><div><p>Administrative Assistant</p><h3>Angie Thomas</h3><a href="mailto:athomas@leecova.org">athomas@leecova.org <Icon name="arrow" size={16} /></a></div></article>
          </div>
        </div>
      </section>

      <section className="county-office-responsibilities" aria-labelledby="county-office-responsibilities-title">
        <div className="container">
          <div className="county-office-responsibilities-heading"><p className="eyebrow light">What the office does</p><h2 id="county-office-responsibilities-title">Leadership across county government</h2><p>The Administration office provides organization, follow-through, and coordination across the work of Lee County.</p></div>
          <div className="county-office-responsibility-grid">{countyAdministrationResponsibilities.map((responsibility, index) => <article key={responsibility.title}><span className="county-office-responsibility-number">0{index + 1}</span><span className="outline-icon"><Icon name={responsibility.icon} size={25} /></span><h3>{responsibility.title}</h3><p>{responsibility.text}</p></article>)}</div>
        </div>
      </section>

      <section className="section county-office-resources" aria-labelledby="county-office-resources-title">
        <div className="container">
          <div className="county-office-section-heading"><div><p className="eyebrow">Related information</p><h2 id="county-office-resources-title">County resources</h2></div><p>Continue to frequently requested government information, public records, meetings, and online services.</p></div>
          <div className="county-office-resource-grid">{countyAdministrationResources.map((resource) => <a href={sitePath(resource.href)} target={resource.external ? '_blank' : undefined} rel={resource.external ? 'noreferrer' : undefined} key={resource.title}><span><Icon name={resource.icon} size={23} /></span><div><h3>{resource.title}</h3><p>{resource.text}</p></div><Icon name={resource.external ? 'external' : 'arrow'} size={18} /></a>)}</div>
        </div>
      </section>
    </main>
  )
}

function InteriorPage({ page }) {
  if (page?.kind === 'county-administration') return <CountyAdministrationPage page={page} />
  if (page?.category === 'Public Notices') return <PublicNoticesPage page={page} />
  if (page?.kind === 'meetings') return <MeetingArchivePage page={page} />
  if (page?.kind === 'documents') return <PublicDocumentLibrary page={page} />
  if (page?.kind === 'calendar') return <CountyCalendarPage page={page} />

  if (!page) {
    return (
      <main id="main-content" className="interior-page">
        <section className="interior-hero compact-interior-hero">
          <div className="container interior-hero-content">
            <p className="eyebrow light">Lee County, Virginia</p>
            <h1>Page not found</h1>
            <p>The page you requested could not be found.</p>
            <a className="interior-home-link" href={sitePath('/')}>Return to the homepage <Icon name="arrow" size={18} /></a>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main id="main-content" className="interior-page">
      <section className="interior-hero">
        <div className="interior-hero-pattern" aria-hidden="true" />
        <div className="container interior-hero-content">
          <nav className="breadcrumbs" aria-label="Breadcrumb"><a href={sitePath('/')}>Home</a><Icon name="chevron" size={14} /><span>{page.navTitle}</span></nav>
          <p className="eyebrow light">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
        </div>
      </section>

      <section className="section interior-content">
        <div className="container">
          <div className="interior-overview">
            <div><p className="eyebrow">Overview</p><h2>{page.heading}</h2></div>
            <p>{page.overview}</p>
          </div>
          <div className="interior-card-grid">
            {page.cards.map((card) => (
              <a className="interior-card" href={sitePath(card.href || '#page-contact')} key={card.title}>
                <span className="service-icon"><Icon name={card.icon} size={27} /></span>
                <span className="interior-card-number">{String(page.cards.indexOf(card) + 1).padStart(2, '0')}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <span className="learn-more">View information <Icon name="arrow" size={17} /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="page-contact" id="page-contact">
        <div className="container page-contact-inner">
          <div><p className="eyebrow light">Need more help?</p><h2>Connect with Lee County</h2><p>Visit the homepage to explore county services, public information, community resources, and important updates.</p></div>
          <a href={sitePath('/')}>Visit the homepage <Icon name="arrow" size={19} /></a>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchMessage, setSearchMessage] = useState('')
  const currentPath = routePath(window.location.pathname)
  const currentPage = interiorPages[currentPath]

  useEffect(() => {
    document.title = currentPath === '/'
      ? 'Lee County, Virginia | Where Virginia Begins'
      : `${currentPath === '/admin' ? 'Administration' : (currentPage?.navTitle || 'Page Not Found')} | Lee County, Virginia`
  }, [currentPage, currentPath])

  function handleSearch(event) {
    event.preventDefault()
    const cleanQuery = query.trim()
    setSearchMessage(cleanQuery ? `Showing results for “${cleanQuery}”` : 'Enter a service, department, or topic to search.')
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="utility-bar">
        <div className="container utility-inner">
          <p>Welcome to Lee County, Virginia — Where Virginia Begins</p>
          <div className="utility-links" aria-label="Utility navigation">
            <a href={sitePath('/calendar')}>County Calendar</a><a href={sitePath('/departments')}>Employment</a><a href="#footer">Contact Us</a>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href={sitePath('/')} aria-label="Lee County, Virginia home">
            <img src={countyLogo} alt="Lee County, Virginia seal" />
            <span className="brand-copy"><strong>Lee County</strong><span>Virginia</span></span>
          </a>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
            <span className="menu-lines" aria-hidden="true"><i /><i /><i /></span><span>{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
          <nav id="primary-navigation" className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Primary navigation">
            {navItems.map((item) => <a href={sitePath(item.href)} aria-current={currentPath === item.href ? 'page' : undefined} onClick={() => setMenuOpen(false)} key={item.href}>{item.label}</a>)}
            <a className="header-search" href={sitePath('/#site-search')} onClick={() => setMenuOpen(false)} aria-label="Search this site"><Icon name="search" size={20} /></a>
          </nav>
        </div>
      </header>

      {currentPath === '/admin' ? <AdminPage /> : currentPath === '/' ? <main id="main-content">
        <section className="hero-section" id="top" style={{ '--hero-image': `url(${heroImage})` }}>
          <div className="hero-shade" />
          <div className="container hero-content">
            <p className="eyebrow light">The official website of Lee County, Virginia</p>
            <h1>Where Virginia<br />Begins</h1>
            <p className="hero-intro">Your connection to county services, local government, public information, and the community we call home.</p>
            <form className="site-search-form" id="site-search" role="search" onSubmit={handleSearch}>
              <label htmlFor="county-search">Search Lee County</label>
              <div className="search-field">
                <Icon name="search" size={23} />
                <input id="county-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What can we help you find?" />
                <button type="submit">Search</button>
              </div>
              {searchMessage && <p className="search-message" role="status">{searchMessage}</p>}
            </form>
          </div>
          <div className="hero-location"><Icon name="pin" size={17} /> Southwest Virginia</div>
        </section>

        <section className="quick-section" aria-labelledby="quick-heading">
          <div className="container">
            <div className="quick-heading-row"><div><p className="eyebrow">Connect with Lee County</p><h2 id="quick-heading">Find what you need</h2></div><p>Quick access to Lee County’s most requested information.</p></div>
            <div className="quick-grid">
              {quickLinks.map((item) => (
                <a className="quick-card" href={sitePath(item.href)} key={item.title}>
                  <span className="icon-box"><Icon name={item.icon} size={27} /></span><span className="card-arrow"><Icon name="chevron" size={18} /></span>
                  <span className="card-copy"><strong>{item.title}</strong><span>{item.description}</span></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section services-section" id="services" aria-labelledby="services-heading">
          <div className="container">
            <div className="section-heading centered"><p className="eyebrow">County Services</p><h2 id="services-heading">County help, all in one place</h2><p>Access departments, offices, programs, and services provided by Lee County.</p></div>
            <div className="service-grid">
              {services.map((service) => <a className="service-card" href={sitePath(service.href || '#footer')} key={service.title}><span className="service-icon"><Icon name={service.icon} size={27} /></span><h3>{service.title}</h3><p>{service.text}</p><span className="learn-more">Learn more <Icon name="arrow" size={17} /></span></a>)}
            </div>
            <div className="center-link"><ArrowLink href="#footer">View all county services</ArrowLink></div>
          </div>
        </section>

        <section className="government-section" id="government" aria-labelledby="government-heading">
          <div className="government-intro"><div className="government-pattern" aria-hidden="true" /><div className="government-intro-content"><p className="eyebrow light">Lee County Government</p><h2 id="government-heading">Serving our communities. Building our future.</h2><p>Lee County government provides effective public services, supports our communities, and promotes responsible growth throughout the county.</p><ArrowLink href="#footer">Explore county government</ArrowLink></div></div>
          <div className="government-links">
            {governmentLinks.map((item) => <a href={sitePath(item.href || '#footer')} className="government-link" key={item.title}><span className="outline-icon"><Icon name={item.icon} size={26} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span><Icon name="chevron" size={19} /></a>)}
          </div>
        </section>

        <section className="section community-section" id="community" aria-labelledby="community-heading">
          <div className="container split-layout">
            <div className="community-copy"><p className="eyebrow">Community & Economic Development</p><h2 id="community-heading">Rooted in community.<br />Ready for opportunity.</h2><p>Lee County is home to thriving communities, natural resources, and new possibilities throughout Southwest Virginia.</p><p>Explore resources that support business, property development, tourism, employment, and continued growth.</p><ArrowLink href="#business">Explore development resources</ArrowLink></div>
            <div className="community-links" aria-label="Community and economic development links">
              <a href="#business"><span>01</span><strong>Economic Development</strong><Icon name="arrow" size={20} /></a>
              <a href="#business"><span>02</span><strong>Business Resources</strong><Icon name="arrow" size={20} /></a>
              <a href="#welcome"><span>03</span><strong>Tourism</strong><Icon name="arrow" size={20} /></a>
              <a href="#footer"><span>04</span><strong>Lee County Airport</strong><Icon name="arrow" size={20} /></a>
            </div>
          </div>
        </section>

        <section className="business-section" id="business" aria-labelledby="business-heading">
          <div className="container business-inner">
            <div className="business-copy"><p className="eyebrow light">Doing Business in Lee County</p><h2 id="business-heading">A strong place to start.<br />A smart place to grow.</h2><p>Whether you are starting a business, expanding an operation, or developing property, find the county information you need to move forward.</p></div>
            <div className="business-list">{businessLinks.map((item, index) => <a href="#footer" key={item}><span>0{index + 1}</span>{item}<Icon name="arrow" size={19} /></a>)}</div>
          </div>
        </section>

        <section className="section resources-section" id="resources" aria-labelledby="resources-heading">
          <div className="container">
            <div className="section-heading inline-heading"><div><p className="eyebrow">Community Resources</p><h2 id="resources-heading">Useful links for everyday life</h2></div><p>Important information and connections for residents, businesses, property owners, and visitors.</p></div>
            <div className="resource-grid">{resourceLinks.map((item) => <a className="resource-card" href="#footer" key={item.title}><Icon name={item.icon} size={25} /><strong>{item.title}</strong><span>{item.text}</span><Icon name="arrow" size={18} /></a>)}</div>
          </div>
        </section>

        <section className="section public-info-section" id="public-info" aria-labelledby="public-info-heading">
          <div className="container">
            <div className="section-heading centered compact-heading"><p className="eyebrow">Property & Public Information</p><h2 id="public-info-heading">Open information. Easy access.</h2><p>Property, government records, finances, and county operations.</p></div>
            <div className="public-info-grid">{publicInfoLinks.map((item) => <a href={sitePath(item.href || '#footer')} key={item.title}><span className="public-icon"><Icon name={item.icon} size={24} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span><Icon name="chevron" size={18} /></a>)}</div>
          </div>
        </section>

        <section className="section updates-section" id="public-notices" aria-labelledby="updates-heading">
          <div className="container">
            <div className="section-heading updates-heading"><div><p className="eyebrow">Stay Connected</p><h2 id="updates-heading">What’s happening in Lee County</h2></div><ArrowLink href="#calendar">View all news & updates</ArrowLink></div>
            <div className="updates-grid" id="calendar">{updates.map((item) => <a className="update-card" href={sitePath(item.href)} key={item.label}><div className="update-top"><span className="update-icon"><Icon name={item.icon} size={25} /></span><span className="update-label">{item.label}</span></div><small>{item.date}</small><h3>{item.title}</h3><span className="learn-more">Learn more <Icon name="arrow" size={17} /></span></a>)}</div>
          </div>
        </section>

        <section className="welcome-section" id="welcome" aria-labelledby="welcome-heading">
          <div className="welcome-mark" aria-hidden="true">L</div>
          <div className="container welcome-inner"><img src={countyLogo} alt="" /><p className="eyebrow light">Welcome to Lee County</p><h2 id="welcome-heading">Where Virginia Begins</h2><p>From our communities and businesses to our mountains, historic sites, and natural resources, Lee County is a special part of Southwest Virginia.</p><p className="welcome-signoff">Lee County, Virginia <span>•</span> Where Virginia Begins.</p></div>
        </section>
      </main> : <InteriorPage page={currentPage} />}

      <footer className="site-footer" id="footer">
        <div className="container footer-main">
          <div className="footer-brand"><a className="brand footer-logo" href={sitePath('/')}><img src={countyLogo} alt="Lee County, Virginia seal" /><span className="brand-copy"><strong>Lee County</strong><span>Virginia</span></span></a><p>County Administration<br />33640 Main Street<br />Jonesville, Virginia</p></div>
          <div className="footer-column"><h3>Quick Links</h3><a href={sitePath('/')}>Home</a><a href={sitePath('/about')}>About Lee County</a><a href={sitePath('/departments')}>County Departments</a><a href={sitePath('/elected-officials')}>Board of Supervisors</a><a href={sitePath('/public-notices')}>Public Notices</a><a href={sitePath('/meeting-minutes')}>Meetings & Minutes</a><a href={sitePath('/bid-notices')}>Bid Notices</a></div>
          <div className="footer-column"><h3>Government</h3><a href={sitePath('/county-administration')}>County Administration</a><a href={sitePath('/elected-officials')}>Constitutional Offices</a><a href={sitePath('/courts')}>Courts</a><a href={sitePath('/#public-info')}>County Code</a><a href={sitePath('/county-budgets')}>Budgets & Audits</a><a href={sitePath('/#public-info')}>Disbursements</a></div>
          <div className="footer-column"><h3>Community</h3><a href={sitePath('/#community')}>Economic Development</a><a href={sitePath('/about')}>Tourism</a><a href={sitePath('/airport')}>Airport</a><a href={sitePath('/#resources')}>Community Resources</a><a href={sitePath('/#resources')}>County Links</a><a href={sitePath('/departments')}>Employment</a></div>
        </div>
        <div className="footer-bottom"><div className="container"><p>© 2026 Lee County, Virginia. All Rights Reserved.</p><div><a href="#footer">Accessibility</a><a href="#footer">Privacy</a><a href="#footer">Site Map</a><a href={sitePath('/admin')}>Admin</a></div></div></div>
      </footer>
    </div>
  )
}

export default App
