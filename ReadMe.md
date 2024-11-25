
# index.html file:

Purpose

This file serves as:
The main entry point for the application
Defines the basic structure and layout
Creates containers for dynamic content
Establishes the sidebar and main content areas
Sets up the scheduling interface

File involved:
Works with styles.css for visual styling
Works with script.js for functionality
Connects to display.html through the "Display Page" button
Serves as the template for the PDF file management interface

# External Resources in the Project

1. **PDF.js Library**

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js"></script>

- Source: CDN (Content Delivery Network) from cdnjs.cloudflare.com
- Version: 2.9.359
- Purpose: Enables PDF file processing in JavaScript, used by the file script.js for extracting text from PDF files

2. **Flatpickr CSS**

<link href="https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.6.13/flatpickr.min.css" rel="stylesheet">

- Source: CDN from cdnjs.cloudflare.com
- Version: 4.6.13
- Purpose: Styles for the date/time selector, used by the scheduling form for styling the date/time inputs

3. **Flatpickr JavaScript**

<script src="https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.6.13/flatpickr.min.js"></script>

- Source: CDN from cdnjs.cloudflare.com
- Version: 4.6.13
- Purpose: Date/time picker functionality, used by the script.js for the scheduling interface functionality

## How They Work Together:

1. **CDN Resources**

- Are loaded first in (index.html) to ensure dependencies are available
- Come from trusted, fast content delivery networks
- Use specific versions to ensure compatibility
- Are minified (.min.) for faster loading, the larger (original) files would take longer to load

2. **Local Resources**

- Are loaded after CDN resources
- Can access functionality provided by CDN resources
- Contain application-specific code and styles
- Are easier to modify and debug
- JavaScript files are loaded at the end of the `<body>`
- First external libraries (PDF.js, flatpickr)
- Then local script files (script.js, display.js)

## Best Practices Used:
1. **CDN Usage**
   - Faster loading through distributed servers
   - Caching benefits
   - Reduced server load


on line :<div id="sidebarToggle">&#9776;</div>
&#9776; is the HTML entity code for the hamburger menu symbol
☰ is the direct Unicode character, this will be displayed on the page.
------------------------------------------------------------------------------------------------------------------------------------------
A CDN is a network of distributed servers that deliver web content to users based on their geographic location, the origin of the webpage, and the content delivery server.
How CDNs Work

Basic Process:

CopyUser (South Africa) → Requests jQuery
↓
CDN finds closest server (e.g., Johannesburg)
↓
Delivers file from nearest location

Popular CDN Providers:
Cloudflare (cloudflare.com) etc
------------------------------------------------------------------------------------------------------------------------------------------