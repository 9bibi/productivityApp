// Wait for the document to load before binding events
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const sessionStatus = document.getElementById('status');

    let timerSessionId = null;

    // Event listener for starting the timer
    startBtn.addEventListener('click', () => {
        const userId = 'adminayala'; // Replace with the actual user ID (e.g., from session or user data)
        const sessionType = 'work'; // You can change this to 'break' for break sessions

        fetch('/timer/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, sessionType })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Timer started:', data);
            timerSessionId = data.togglEntryId; // Store Toggl entry ID for stopping the timer later
            sessionStatus.textContent = 'Working';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
        })
        .catch(error => {
            console.error('Error starting timer:', error);
        });
    });

    // Event listener for stopping the timer
    stopBtn.addEventListener('click', () => {
        if (!timerSessionId) {
            console.error('No active session to stop');
            return;
        }

        fetch('/timer/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeEntryId: timerSessionId })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Timer stopped:', data);
            sessionStatus.textContent = 'Idle';
            stopBtn.style.display = 'none';
            startBtn.style.display = 'inline-block';
        })
        .catch(error => {
            console.error('Error stopping timer:', error);
        });
    });
});
