document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileList = document.getElementById('fileList');
    const fileNameHeader = document.getElementById('fileNameHeader');
    const extractedText = document.getElementById('extractedText');
    const filterCtnBtn = document.getElementById('filterCtnBtn');
    const historyLogBtn = document.getElementById('historyLogBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const historyLog = document.getElementById('historyLog');
    const scheduleControls = document.getElementById('scheduleControls');
    const scheduleStart = document.getElementById('scheduleStart');
    const scheduleEnd = document.getElementById('scheduleEnd');
    const scheduleBtn = document.getElementById('scheduleBtn');
    const displayPageBtn = document.getElementById('displayPageBtn');

    let uploadedFiles = [];
    let currentDisplayIndex = -1;
    let fileHistory = [];

    // Initialize date time pickers
    const startPicker = flatpickr("#scheduleStart", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true,
        minuteIncrement: 1,
        onChange: function(selectedDates, dateStr) {
            endPicker.set('minDate', dateStr);
        }
    });

    const endPicker = flatpickr("#scheduleEnd", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true,
        minuteIncrement: 1
    });

    // Event Listeners
    clearBtn.addEventListener('click', clearAll);
    filterCtnBtn.addEventListener('click', filterCtnSchedules);
    uploadBtn.addEventListener('click', () => fileInput.click());
    historyLogBtn.addEventListener('click', toggleHistoryLog);
    sidebarToggle.addEventListener('click', toggleSidebar);
    scheduleBtn.addEventListener('click', scheduleCurrentFile);
    displayPageBtn.addEventListener('click', openDisplayPage);
    fileInput.addEventListener('change', handleFileUpload);

    function handleFileUpload(event) {
        const newFiles = Array.from(event.target.files).filter(file => file.type === 'application/pdf');
        processFiles(newFiles);
    }

    async function processFiles(files) {
        for (const file of files) {
            try {
                const text = await extractTextFromPdf(file);
                uploadedFiles.push({ file, text, filteredText: '', scheduleStart: null, scheduleEnd: null });
                addToHistory(`Uploaded: ${file.name}`);
            } catch (error) {
                console.error(`Error extracting text from ${file.name}:`, error);
                uploadedFiles.push({ file, text: `Error extracting text from ${file.name}.`, filteredText: '', scheduleStart: null, scheduleEnd: null });
                addToHistory(`Error uploading: ${file.name}`);
            }
        }
        updateFileList();
        if (uploadedFiles.length > 0) {
            displayFileContent(uploadedFiles.length - 1);
        }
    }

    function updateFileList() {
        fileList.innerHTML = '';
        uploadedFiles.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = item.file.name;
            listItem.addEventListener('click', () => displayFileContent(index));
            fileList.appendChild(listItem);
        });
    }

    function displayFileContent(index) {
        currentDisplayIndex = index;
        const { file, text, filteredText, scheduleStart, scheduleEnd } = uploadedFiles[index];
        fileNameHeader.textContent = file.name;

        // Create editable container and save button
        const editableContainer = document.createElement('div');
        editableContainer.contentEditable = true;
        editableContainer.className = 'editable-content';
        editableContainer.textContent = filteredText || text;

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save Changes';
        saveButton.className = 'save-button';
        saveButton.style.display = 'none';

        // Replace extractedText content with editable container
        extractedText.innerHTML = '';
        extractedText.appendChild(editableContainer);
        extractedText.appendChild(saveButton);

        // Add event listeners
        editableContainer.addEventListener('input', () => {
            saveButton.style.display = 'block';
        });

        saveButton.addEventListener('click', () => {
            const newText = editableContainer.textContent;
            if (filteredText) {
                uploadedFiles[currentDisplayIndex].filteredText = newText;
            } else {
                uploadedFiles[currentDisplayIndex].text = newText;
            }
            saveScheduledFiles();
            saveButton.style.display = 'none';
            addToHistory(`Edited: ${file.name}`);
            alert('Changes saved successfully!');
        });

        scheduleControls.classList.remove('hidden');
        startPicker.setDate(scheduleStart || '');
        endPicker.setDate(scheduleEnd || '');
        addToHistory(`Displayed: ${file.name}`);
    }

    function filterCtnSchedules() {
        if (currentDisplayIndex === -1) return;

        const { text } = uploadedFiles[currentDisplayIndex];
        const entries = text.split('\n\n');
        let filteredText = '';

        // Keep the header information
        const headerLines = entries[0].split('\n');
        filteredText = headerLines.join('\n') + '\n\n';

        // Filter the entries
        for (let i = 1; i < entries.length; i++) {
            if (entries[i].includes('CTN')) {
                filteredText += entries[i] + '\n\n';
            }
        }

        uploadedFiles[currentDisplayIndex].filteredText = filteredText.trim();
        displayFileContent(currentDisplayIndex);
        addToHistory(`Filtered CTN schedules for: ${uploadedFiles[currentDisplayIndex].file.name}`);
    }

    function scheduleCurrentFile() {
        if (currentDisplayIndex === -1) return;

        const start = startPicker.selectedDates[0];
        const end = endPicker.selectedDates[0];

        if (!start || !end) {
            alert('Please select both start and end times.');
            return;
        }

        if (start >= end) {
            alert('End time must be after start time.');
            return;
        }

        // Check for scheduling conflicts
        const conflicts = checkScheduleConflicts(start, end, currentDisplayIndex);
        
        if (conflicts.length > 0) {
            const confirmMessage = `There are scheduling conflicts with the following files:\n${
                conflicts.map(c => `- ${c.fileName} (${new Date(c.conflictStart).toLocaleString()} - ${new Date(c.conflictEnd).toLocaleString()})`).join('\n')
            }\n\nDo you want to continue anyway?`;
            
            if (!confirm(confirmMessage)) {
                return;
            }
        }

        uploadedFiles[currentDisplayIndex].scheduleStart = start;
        uploadedFiles[currentDisplayIndex].scheduleEnd = end;

        addToHistory(`Scheduled: ${uploadedFiles[currentDisplayIndex].file.name} from ${start.toLocaleString()} to ${end.toLocaleString()}`);
        saveScheduledFiles();
        
        alert('File scheduled successfully!');
    }

    function checkScheduleConflicts(start, end, excludeIndex) {
        return uploadedFiles.reduce((acc, file, index) => {
            if (index === excludeIndex || !file.scheduleStart || !file.scheduleEnd) {
                return acc;
            }
            
            const fileStart = new Date(file.scheduleStart);
            const fileEnd = new Date(file.scheduleEnd);
            
            if (start <= fileEnd && end >= fileStart) {
                acc.push({
                    fileName: file.file.name,
                    conflictStart: fileStart,
                    conflictEnd: fileEnd
                });
            }
            
            return acc;
        }, []);
    }

    function addToHistory(message) {
        const timestamp = new Date().toLocaleString();
        fileHistory.push(`${timestamp} - ${message}`);
        updateHistoryLog();
    }

    function updateHistoryLog() {
        historyLog.innerHTML = fileHistory.map(entry => `<div>${entry}</div>`).join('');
    }

    function toggleHistoryLog() {
        historyLog.classList.toggle('hidden');
    }

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    function openDisplayPage() {
        window.open('display.html', 'displayPage');
    }

    function clearAll() {
        fileList.innerHTML = '';
        fileNameHeader.textContent = '';
        extractedText.innerHTML = '';
        uploadedFiles = [];
        fileInput.value = '';
        currentDisplayIndex = -1;
        fileHistory = [];
        updateHistoryLog();
        scheduleControls.classList.add('hidden');
        localStorage.removeItem('scheduledFiles');
    }

    async function extractTextFromPdf(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        let headerInfo = {
            printed: '',
            title: '',
            date: ''
        };

        const printedRegex = /Printed:\s*(\d{4}\/\d{2}\/\d{2}\s*\d{1,2}:\d{2}(?:AM|PM))/i;
        const titleRegex = /(RMC Traffic Schedules)/i;
        const dateRegex = /(\d{2}-\d{2}-\d{2})/;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');

            if (!headerInfo.printed) {
                const printedMatch = pageText.match(printedRegex);
                if (printedMatch) headerInfo.printed = printedMatch[0];
            }
            if (!headerInfo.title) {
                const titleMatch = pageText.match(titleRegex);
                if (titleMatch) headerInfo.title = titleMatch[0];
            }
            if (!headerInfo.date) {
                const dateMatch = pageText.match(dateRegex);
                if (dateMatch) headerInfo.date = dateMatch[0];
            }

            const scheduleRegex = /(\d{2}:\d{2})\s*(\d{2}:\d{2})\s*(.*?)\s*(\d{2}-\d{7})\s+(?:(TEMP|PERM)\s+LINES\s+RFJHB\s+)?(.*?)(?=\s+Report\s*:|$)/gi;
            let match;

            while ((match = scheduleRegex.exec(pageText)) !== null) {
                let [, startTime, endTime, name, reference, lineType, lineDetails] = match;
                
                fullText += `Start time: ${formatTime(startTime)}\n`;
                fullText += `End time: ${formatTime(endTime)}\n`;
                fullText += `Name: ${name.trim()}\n`;
                fullText += `Reference: ${reference}\n`;
                if (lineType) {
                    fullText += `Line Type: ${lineType}\n`;
                }
                fullText += processLineDetails(lineDetails);
                fullText += 'Report\n\n';
            }
        }

        // Prepend the header information
        let header = '';
        if (headerInfo.printed) header += `${headerInfo.printed}\n`;
        if (headerInfo.title) header += `${headerInfo.title}\n`;
        if (headerInfo.date) header += `${headerInfo.date}\n`;
        if (header) header += '\n';

        return header + fullText.trim();
    }

    function processLineDetails(lineDetails) {
        const lineRegex = /([A-Z]+)\s*-\s*([A-Z]+)\s*(\d+)/g;
        let match;
        let formattedLines = '';

        while ((match = lineRegex.exec(lineDetails)) !== null) {
            const [, source, destination, lineNumber] = match;
            formattedLines += `Line ${lineNumber}: ${source} (source) - ${destination} (destination)\n`;
        }

        return formattedLines;
    }

    function formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hoursNum = parseInt(hours, 10);
        const ampm = hoursNum >= 12 ? 'pm' : 'am';
        const formattedHours = hoursNum % 12 || 12;
        return `${formattedHours}:${minutes}${ampm}`;
    }

    function saveScheduledFiles() {
        const scheduledFiles = uploadedFiles.filter(file => file.scheduleStart && file.scheduleEnd).map(file => ({
            name: file.file.name,
            text: file.filteredText || file.text,
            scheduleStart: file.scheduleStart.toISOString(),
            scheduleEnd: file.scheduleEnd.toISOString()
        }));
        localStorage.setItem('scheduledFiles', JSON.stringify(scheduledFiles));
    }
});
