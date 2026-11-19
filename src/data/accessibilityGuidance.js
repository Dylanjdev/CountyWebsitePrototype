export const ADOBE_ACCESSIBILITY_HELP_URL = 'https://helpx.adobe.com/acrobat/using/create-verify-pdf-accessibility.html'

const openTagsPanel = 'Open the Accessibility tags panel from Menu/File > View > Show/Hide > Side panels > Accessibility tags.'
const showFailedItem = 'In Acrobat Pro, run Check for accessibility, open this failed rule, and use Show in Tags Panel to locate each affected item.'

function guide(categories, rules, explanation, steps, verification) {
  return { categories, rules, explanation, steps, verification }
}

const remediationGuides = [
  guide(['document'], ['accessibility permission flag', 'accessibility permissions'],
    'The PDF security settings may prevent a screen reader from extracting and reading its text.',
    [
      'Open File/Menu > Document Properties > Security.',
      'Remove security or change the permissions so assistive technology can extract the document content.',
      'Save the PDF. If a password or security policy is required, confirm that it still permits accessibility access.',
    ],
    'Run the accessibility check again and confirm Accessibility permission flag passes.'),
  guide(['document'], ['image-only pdf', 'document is not image only pdf', 'not image only pdf'],
    'At least part of the document is a scanned image without dependable machine-readable text. Screen readers and search cannot use image pixels as words.',
    [
      'Open All tools > Scan & OCR, choose Recognize Text > In this file, and select the correct document language.',
      'Run recognition for every scanned page. Correct recognition errors, especially names, dates, totals, and headings.',
      'Run Automatically tag PDF, then inspect the tag structure and reading order because OCR alone does not add complete document semantics.',
    ],
    'Select and copy text from several pages, search for known words, and listen to the pages with a screen reader before rerunning the check.'),
  guide(['document'], ['tagged pdf', 'document is tagged pdf'],
    'The PDF does not have a usable tag tree describing headings, paragraphs, lists, tables, figures, and reading order.',
    [
      'Re-export the PDF as a tagged PDF from the original Word, Excel, or publishing file when possible.',
      'If the source is unavailable, use All tools > Prepare for accessibility > Automatically tag PDF.',
      'Review the resulting Accessibility tags and Reading Order. Correct incorrect element types and misplaced content.',
    ],
    'Confirm the tag tree follows the visible document and rerun the checker.'),
  guide(['document'], ['logical reading order', 'reading order'],
    'Adobe cannot determine whether a screen reader will announce the content in a meaningful sequence. A person must review it.',
    [
      'Open All tools > Prepare for accessibility > Fix reading order and display the page order.',
      'Inspect every page in sequence, including multi-column text, sidebars, footnotes, headers, and captions.',
      'Reorder tags so the spoken order matches the meaning of the page. Mark decorative headers, footers, and page furniture as artifacts.',
    ],
    'Use Read Out Loud or a screen reader from the first page through the last, without relying on the visual page.'),
  guide(['document'], ['primary language', 'document language', 'language'],
    'The document does not identify its main language, so a screen reader may use the wrong pronunciation rules.',
    [
      'Open File/Menu > Document Properties > Advanced.',
      'Under Reading Options, set Language to the document’s primary language.',
      'For passages in another language, set the language on the corresponding tag in the Accessibility tags panel.',
    ],
    'Rerun the checker and listen to both the primary text and any foreign-language passages.'),
  guide(['document'], ['title', 'document title'],
    'The PDF is missing a descriptive document title or is configured to show only its filename.',
    [
      'Open File/Menu > Document Properties > Description and enter a concise, specific title.',
      'Open Initial View and set Show to Document Title.',
      'Save and reopen the PDF to confirm the title appears in the application title bar.',
    ],
    'Rerun the checker and confirm Title passes.'),
  guide(['document'], ['bookmarks'],
    'A longer document does not provide bookmarks that let keyboard and screen-reader users move between its major sections.',
    [
      'Open the Bookmarks panel in Acrobat Pro.',
      'Create bookmarks from the document’s heading structure, or add them manually for each major section.',
      'Arrange bookmarks in the same hierarchy and order as the headings, and give each one a meaningful label.',
    ],
    'Activate every bookmark with the keyboard and confirm it moves to the correct section.'),
  guide(['document'], ['color contrast', 'contrast'],
    'Text or meaningful graphics may not have enough contrast for people with low vision. Adobe generally requires a person to measure this.',
    [
      'Check text and meaningful graphics with a contrast analyzer; do not judge contrast by sight alone.',
      'In the source document, adjust colors to meet WCAG AA: 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful graphics or controls.',
      'Make sure color is not the only way the document communicates status or meaning, then export a new tagged PDF.',
    ],
    'Review all pages at 200% zoom and in a high-contrast display mode, then record the measured contrast results.'),

  guide(['page content', 'page'], ['tagged content'],
    'Some visible content is absent from the tag tree and is not marked as decorative, so assistive technology may miss it or announce it incorrectly.',
    [
      showFailedItem,
      'Tag meaningful content with the correct element type using Fix reading order or Create Tag From Selection.',
      'Mark purely decorative or repeated page furniture as an artifact instead of giving it a content tag.',
    ],
    'Compare each page with the tag tree and confirm every meaningful item appears exactly once.'),
  guide(['page content', 'page'], ['tagged annotations'],
    'A link, comment, or other annotation is not connected to the document structure and may be unavailable to assistive technology.',
    [
      showFailedItem,
      'Add each meaningful annotation to the correct location in the tag tree. Mark nonessential annotations as artifacts or remove them.',
      'For links, confirm that the link annotation is nested inside a Link tag with meaningful link text.',
    ],
    'Navigate every annotation and link with the Tab key and a screen reader.'),
  guide(['page content', 'page'], ['tab order'],
    'Keyboard focus may move through links, fields, or annotations in an order that does not match the document.',
    [
      'Open the Page Thumbnails panel and choose Page Properties for the first page.',
      'Set Tab Order to Use Document Structure.',
      'Repeat for every page, then correct the tag order if the resulting keyboard sequence is not logical.',
    ],
    'Press Tab from the beginning of each page and confirm focus moves in a predictable reading order.'),
  guide(['page content', 'page'], ['character encoding', 'encoding'],
    'One or more characters do not map reliably to readable text. Screen readers, copying, and search may produce missing or incorrect characters.',
    [
      'Try copying the affected text into a plain-text editor to identify incorrect characters.',
      'Return to the source document, replace damaged or unsupported fonts with a Unicode/OpenType font, and correct the source text.',
      'Export a new tagged PDF with fonts embedded. Character mapping problems often cannot be repaired reliably inside Acrobat.',
    ],
    'Copy, search, and listen to the corrected passages, then rerun the checker.'),
  guide(['page content', 'page'], ['tagged multimedia', 'multimedia'],
    'Audio, video, or another multimedia object is missing a structural tag or accessible alternative.',
    [
      'Locate the multimedia object in the Content and Accessibility tags panels.',
      'Add it to the tag tree in the correct reading position, or mark it as an artifact if it is decorative.',
      'Provide captions for video, a transcript for audio, audio description where needed, and an accessible fallback link or description.',
    ],
    'Operate the media with only the keyboard and verify its captions, transcript, controls, and reading order.'),
  guide(['page content', 'page'], ['screen flicker', 'flicker'],
    'Animated or scripted content may flash in a way that can trigger seizures or make magnified content difficult to follow.',
    [
      'Inspect every animation, video, and scripted element for flashing.',
      'Remove the flashing content or edit it so it does not flash more than three times per second.',
      'Provide controls to pause or stop any nonessential motion.',
    ],
    'Test the final media and document with an appropriate flash-analysis tool.'),
  guide(['page content', 'page'], ['scripts', 'script'],
    'Document JavaScript may interfere with keyboard access or expose functionality without an accessible name, role, or state.',
    [
      'Review all document actions and JavaScript in Acrobat Pro.',
      'Remove unnecessary scripts and ensure every remaining action works by keyboard without a trap.',
      'Provide accessible labels, instructions, error messages, and a non-script fallback where appropriate.',
    ],
    'Complete every scripted task using only a keyboard and test it with a screen reader.'),
  guide(['page content', 'page'], ['timed responses', 'timed response'],
    'A form or script may require action within a time limit that some users cannot meet.',
    [
      'Identify scripts, media, or forms that impose a time limit.',
      'Remove the limit when possible. Otherwise let users turn it off, extend it, or request more time before it expires.',
      'Preserve entered data when time is extended or a session is restored.',
    ],
    'Test the complete task slowly and confirm the user receives a warning and can extend any necessary limit.'),
  guide(['page content', 'page'], ['accessible links', 'links'],
    'A URL or link annotation may be untagged, use unclear link text, or be repeated in a way that makes navigation difficult.',
    [
      'Find every failed link and make sure it is an active link annotation inside a Link tag.',
      'Replace vague text such as “click here” with text that identifies the destination or purpose.',
      'Remove duplicate navigation links or provide a way to bypass repeated groups of links.',
    ],
    'Tab to and activate every link; confirm a screen reader announces a meaningful name and the destination is correct.'),

  guide(['forms', 'form'], ['tagged form fields', 'form fields are tagged'],
    'One or more interactive form fields are not represented in the tag tree, so their position and purpose may be unclear.',
    [
      'Open Prepare a form and confirm every visible control is a real interactive field rather than a drawing of one.',
      'Use Automatically tag PDF, then place each form-field tag next to its visible label and instructions in the tag tree.',
      'Set a logical tab order and remove or hide duplicate fields.',
    ],
    'Complete and submit the entire form using only the keyboard and a screen reader.'),
  guide(['forms', 'form'], ['field descriptions', 'form field descriptions'],
    'A form control is missing a programmatic description, so a screen reader may announce only “edit” or “checkbox.”',
    [
      'Open Prepare a form, right-click the failed field, and choose Properties.',
      'On the General tab, add a concise, unique Tooltip that states the field’s purpose. Include required format information in nearby instructions.',
      'Repeat for every button, text field, checkbox, radio button, list, and signature field.',
    ],
    'Tab through the form with a screen reader and confirm every field’s purpose and state are clear.'),

  guide(['alternate text', 'alternatives'], ['figures alternate text', 'figure alternate text'],
    'An image is missing a text alternative or has not been identified as decorative.',
    [
      'Open Set Alternate Text from Prepare for accessibility and review every figure.',
      'Write concise alternative text that communicates the image’s purpose in context. For charts, include the important data or a nearby full description.',
      'Mark an image as decorative only when it adds no information and can be skipped safely.',
    ],
    'Read the surrounding text followed by the alternative text and confirm it conveys the same purpose without unnecessary visual detail.'),
  guide(['alternate text', 'alternatives'], ['nested alternate text'],
    'Alternative text is applied to a child inside another element with alternative text. Screen readers may skip or duplicate the nested description.',
    [
      openTagsPanel,
      'Locate the nested element and decide which single parent or child should provide the description.',
      'Remove duplicate Alternate Text from the other nested tags while preserving their correct structure.',
    ],
    'Listen to the figure with a screen reader and confirm its description is announced once.'),
  guide(['alternate text', 'alternatives'], ['associated with content', 'alternate text associated'],
    'A tag contains alternative text but is not associated with visible page content, so some screen-reader settings may never announce it.',
    [
      showFailedItem,
      'Associate the tag with the correct page object and place it in the proper reading position.',
      'If the tag has no meaningful page content, remove the orphaned tag and its alternate text.',
    ],
    'Inspect the tag in the page content view and confirm a screen reader announces it at the intended location.'),
  guide(['alternate text', 'alternatives'], ['hides annotation', 'alternate text hides annotation'],
    'A parent tag’s alternative text is hiding a link, comment, or other interactive annotation nested beneath it.',
    [
      openTagsPanel,
      'Find the parent element containing the annotation and remove its Alternate Text.',
      'Give the meaningful child figure its own alternative text and keep the annotation separately tagged and keyboard reachable.',
    ],
    'Confirm the image description and the annotation are both announced and operable.'),
  guide(['alternate text', 'alternatives'], ['other elements alternate text', 'other alternate text'],
    'A non-figure object such as multimedia, an annotation, or a 3D object has missing, misplaced, or unusable alternative text.',
    [
      showFailedItem,
      'Add a meaningful text alternative to the tag associated with the page object, or provide a nearby accessible equivalent.',
      'Remove alternate text from orphaned tags and mark purely decorative content as an artifact.',
    ],
    'Use a screen reader to confirm the alternative is announced in context and the object remains operable.'),

  guide(['tables', 'table'], ['rows', 'table rows'],
    'The table tag tree has rows outside the expected table structure, which prevents assistive technology from understanding the grid.',
    [
      showFailedItem,
      'Arrange the table as Table > TR rows, optionally grouped within THead, TBody, and TFoot.',
      'Move stray cells into the correct row and remove layout-only table tags.',
    ],
    'Navigate the table by row and column with a screen reader and confirm the cells are announced in the right order.'),
  guide(['tables', 'table'], ['th and td', 'table header and data cells'],
    'Header cells (TH) or data cells (TD) are not nested under a table row (TR).',
    [
      showFailedItem,
      'Place every TH and TD directly inside the correct TR tag.',
      'Change header cells to TH and ordinary data cells to TD; remove empty structural tags that do not represent real cells.',
    ],
    'Inspect the full Table > TR > TH/TD hierarchy and test table navigation with a screen reader.'),
  guide(['tables', 'table'], ['headers', 'table headers'],
    'The table does not identify the row or column headers needed to understand each data cell.',
    [
      'Use the Reading Order table editor or Accessibility tags panel to identify every header cell as TH.',
      'Set each header’s scope to Row, Column, or Both. For complex tables, assign header and cell IDs.',
      'Split overly complex tables or recreate them in the source document when their relationships cannot be expressed clearly.',
    ],
    'Navigate data cells with a screen reader and confirm the relevant row and column headers are announced.'),
  guide(['tables', 'table'], ['regularity', 'table regularity'],
    'The table has irregular rows or columns, often because of merged or split cells, so cell relationships may be ambiguous.',
    [
      'Count the logical columns in every row and identify merged, split, or missing cells.',
      'Simplify the table in the source document when possible; otherwise set correct row/column spans and header associations in Acrobat.',
      'Use separate simpler tables when one complex visual table cannot be represented as a clear data grid.',
    ],
    'Navigate the entire table with a screen reader and confirm it stays in the expected row and column.'),
  guide(['tables', 'table'], ['summary', 'table summary'],
    'Adobe is asking for human review of whether a complex table needs a short explanation of its purpose or organization.',
    [
      'Decide whether the nearby heading and caption already explain the table adequately.',
      'If not, use Fix reading order, select the table, and add a concise table summary describing its purpose and layout.',
      'Do not repeat every cell or use the summary as a substitute for proper headers and structure.',
    ],
    'Read the heading, caption, optional summary, and first few cells together and confirm they orient the reader.'),

  guide(['lists', 'list'], ['list items'],
    'A list item (LI) is outside a list (L), so assistive technology may not announce the list or its item count correctly.',
    [
      showFailedItem,
      'Arrange each list as an L tag containing one LI tag for every item.',
      'Keep nested lists inside the appropriate list-item body rather than beside the parent list.',
    ],
    'Listen with a screen reader and confirm it announces the list, number of items, nesting, and list end.'),
  guide(['lists', 'list'], ['lbl and lbody', 'label and list item body'],
    'A list item does not have the expected label/body structure, which can separate a bullet or number from its text.',
    [
      showFailedItem,
      'Inside each LI, place the bullet or number in an Lbl tag and the item content in an LBody tag.',
      'Keep any continuation paragraphs or nested list inside the same LBody.',
    ],
    'Check the tag tree and listen to numbered and bulleted items with a screen reader.'),

  guide(['headings', 'heading'], ['appropriate nesting', 'heading nesting'],
    'Heading levels may skip or use an illogical hierarchy, making the document outline difficult to navigate.',
    [
      showFailedItem,
      'Use one H1 for the document’s main title, then organize sections with H2, subsections with H3, and so on without choosing levels for appearance.',
      'Change incorrect heading tags and make visually styled non-headings into paragraphs.',
    ],
    'Use a screen reader’s heading list to confirm the outline is complete, descriptive, and logically nested.'),
]

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function includesPattern(value, pattern) {
  return value === pattern || value.includes(pattern)
}

export function getAccessibilityGuidance(category, ruleName, status) {
  const normalizedCategory = normalize(category)
  const normalizedRule = normalize(ruleName)
  const categoryMatches = remediationGuides.filter((item) => item.categories
    .some((candidate) => includesPattern(normalizedCategory, normalize(candidate))))
  const matchedGuide = categoryMatches.find((item) => item.rules
    .some((candidate) => includesPattern(normalizedRule, normalize(candidate))))
    || remediationGuides.find((item) => item.rules.some((candidate) => normalizedRule === normalize(candidate)))

  if (matchedGuide) return matchedGuide

  const needsManualReview = normalize(status).includes('manual')
  return {
    explanation: needsManualReview
      ? 'Adobe cannot decide this rule automatically. A person must inspect the document and record whether it passes or needs correction.'
      : 'This PDF did not satisfy an automated accessibility rule. The downloaded Adobe report may identify the affected page or object.',
    steps: [
      'Open the PDF in Acrobat Pro and run All tools > Prepare for accessibility > Check for accessibility.',
      `Find “${ruleName || 'this rule'},” open its affected items, and choose Explain or Show in Tags Panel for the exact location.`,
      'Correct every affected item, then test the result with the keyboard and a screen reader instead of relying only on the automated status.',
    ],
    verification: 'Run the Acrobat accessibility check again and document the manual test result.',
  }
}
