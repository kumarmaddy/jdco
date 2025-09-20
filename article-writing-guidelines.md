Guidelines for Writing Articles for the Resources Page
These guidelines ensure that articles added to updates.json, knowledge-articles.json, or downloads.json render correctly with proper paragraph formatting and clickable hyperlinks on the Resources page of www.jayadeva.in.
JSON Structure
Each article must follow this JSON structure:
{
"title": "Your Article Title",
"date": "YYYY-MM-DD",
"content": "Your article content in markdown format.",
"tags": ["Tag1", "Tag2"],
"pinned": false,
"file": "files/filename.pdf" // Optional, for Downloads section only
}

title: A string for the article title (e.g., "Understanding GST for Small Businesses"). Required.
date: A string in YYYY-MM-DD format (e.g., "2025-09-01"). Optional, but recommended for sorting.
content: A string in markdown format for Updates and Knowledge Articles. Use description instead for Downloads. Required.
tags: An array of strings for filtering (e.g., ["GST", "Tax"]). Optional.
pinned: A boolean (true or false) to pin the article to the top of its section. Default to false.
file: A string with the file path (e.g., "files/sample-report.pdf") for downloadable files in the Downloads section. Optional.

Example
{
"title": "Understanding GST for Small Businesses",
"date": "2025-09-01",
"content": "Details about GST compliance.\n\nSee [GST Council website](https://www.gst.gov.in) for more information.\n\nAdditional paragraph.",
"tags": ["GST", "Tax"],
"pinned": true
}

Markdown Formatting
The content (or description for Downloads) field uses markdown, parsed by showdown.js. Follow these rules for consistent rendering:
Paragraphs

Separate paragraphs with a single blank line (two newline characters, \n\n).
Do not use multiple blank lines, as they may create extra spacing.
Example:This is the first paragraph.

This is the second paragraph with a [link](https://example.com).

Renders as:<p>This is the first paragraph.</p>

<p>This is the second paragraph with a <a href="https://example.com" target="_blank">link</a>.</p>

Hyperlinks

Use markdown link syntax: [Link Text](URL).
Ensure URLs include the protocol (https:// or http://).
Links will render as clickable <a> tags with blue color (#1a73e8, hover #134c9e) and open in a new tab.
Example:Visit the [GST Council website](https://www.gst.gov.in) for details.

Renders as:<p>Visit the <a href="https://www.gst.gov.in" target="_blank">GST Council website</a> for details.</p>

For one-line content, ensure the text is concise to fit the two-line preview:See [GST Council website](https://www.gst.gov.in).

Tips for Content

Preview Display: The article preview shows the first two lines of content or description. Keep the opening concise for a clean preview.
Avoid Headers: Do not use markdown headers (e.g., # Heading) in content, as the title is already provided in the title field.
Line Length: Keep lines under 80 characters for readability in JSON files.
Escape Quotes: If using quotes in content, escape them with \ (e.g., "It\'s a test").
Test Short Content: For one-line content (e.g., a single link), verify it displays cleanly in the preview without truncation issues.

Adding an Article

Edit JSON File:
Open the relevant file: data/updates.json, data/knowledge-articles.json, or data/downloads.json.
Add a new JSON object with the structure above.
Set pinned: true to place the article at the top of its section, or false for date-based sorting.
For Downloads, include a file path and use description instead of content.

Validate JSON:
Use a JSON validator (e.g., jsonlint.com) to ensure syntax is correct.
Check for missing commas, unescaped quotes, or incorrect boolean values.

Commit Changes:
Locally:git add data/updates.json
git commit -m "Add new article: Your Article Title"
git push origin main

Or use GitHub’s web interface to edit the file.

Test Locally:
Run a local server:python -m http.server 8000

Open http://localhost:8000/resources.html.
Verify:
Article appears in the correct section (Updates, Knowledge Articles, or Downloads).
Preview shows first two lines with clickable links (blue, #1a73e8).
Popup shows full content with paragraphs and links.
Pinned articles appear at the top with a push_pin icon.

Check console for errors (e.g., Failed to fetch, showdown.js not loaded).

Common Pitfalls

Raw Markdown in Preview: If raw markdown (e.g., [text](url)) appears, ensure content or description is valid markdown and showdown.js is loaded.
Truncated Preview: If the preview cuts off awkwardly, shorten the first two lines or avoid long sentences.
Broken Links: Always include https:// in URLs to ensure clickable links.
JSON Errors: Missing commas or unescaped quotes will break the site. Validate JSON before committing.

Example Articles
Updates or Knowledge Articles
{
"title": "New Tax Update",
"date": "2025-10-06",
"content": "This is the first paragraph of the update.\n\nFor more details, visit [Tax Website](https://www.tax.gov).",
"tags": ["Tax", "Update"],
"pinned": false
}

Downloads
{
"title": "Tax Guide PDF",
"date": "2025-10-01",
"description": "Download the guide at [Tax Website](https://www.tax.gov).",
"file": "files/tax-guide.pdf",
"tags": ["Tax", "Download"],
"pinned": false
}

By following these guidelines, your articles will display with proper paragraphs, clickable hyperlinks, and consistent formatting on the Resources page.
