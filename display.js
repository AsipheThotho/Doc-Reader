function updateCurrentTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleString();
}

function displayScheduledFiles() {
    const scheduledFiles = JSON.parse(localStorage.getItem('scheduledFiles')) || [];
    const scheduledFilesContainer = document.getElementById('scheduledFiles');
    const fileInfoContainer = document.getElementById('fileInfo');
    scheduledFilesContainer.innerHTML = '';
    fileInfoContainer.innerHTML = '';
    
    const now = new Date();
    let fileInfo = '';
    let scheduleElements = [];
    
    scheduledFiles.forEach(file => {
        const start = new Date(file.scheduleStart);
        const end = new Date(file.scheduleEnd);
        
        if (now >= start && now <= end) {
            const lines = file.text.split('\n');
            
            // Process file information (only once)
            if (!fileInfo) {
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].trim() === '') break;
                    fileInfo += lines[i] + '<br>';
                }
                fileInfoContainer.innerHTML = `<h2>File Information</h2>${fileInfo}`;
            }
            
            // Process schedules
            let currentSchedule = null;
            let scheduleContent = '';
            
            for (let i = fileInfo.split('<br>').length; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('Start time:')) {
                    if (currentSchedule) {
                        scheduleElements.push(currentSchedule);
                    }
                    currentSchedule = {
                        content: '',
                        startTime: ''
                    };
                    scheduleContent = line + '<br>';
                    currentSchedule.startTime = line.split(':')[1].trim();
                } else if (currentSchedule && line) {
                    scheduleContent += line + '<br>';
                }
                if (currentSchedule) {
                    currentSchedule.content = scheduleContent;
                }
            }
            if (currentSchedule) {
                scheduleElements.push(currentSchedule);
            }
        }
    });
    
    if (scheduleElements.length === 0) {
        scheduledFilesContainer.innerHTML = '<div class="no-schedules">No files currently scheduled for display.</div>';
        return;
    }

    // Sort schedules by start time
    scheduleElements.sort((a, b) => {
        const timeA = new Date('1970/01/01 ' + a.startTime).getTime();
        const timeB = new Date('1970/01/01 ' + b.startTime).getTime();
        return timeA - timeB;
    });

    // Create schedule elements
    scheduleElements.forEach(schedule => {
        const scheduleElement = document.createElement('div');
        scheduleElement.className = 'schedule-container';
        scheduleElement.innerHTML = schedule.content;
        scheduledFilesContainer.appendChild(scheduleElement);
    });
}

function initialize() {
    updateCurrentTime();
    displayScheduledFiles();
    setInterval(updateCurrentTime, 1000); // Update time every second
    setInterval(displayScheduledFiles, 60000); // Refresh displayed files every minute
}

initialize();