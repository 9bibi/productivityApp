const addHabitBtn = document.getElementById('add-habit-btn');
const habitNameInput = document.getElementById('habit-name');
const habitFrequencyInput = document.getElementById('habit-frequency');
const habitCategoryInput = document.getElementById('habit-category');
const habitGoalInput = document.getElementById('habit-goal');
const habitList = document.getElementById('habit-list');
const notification = document.getElementById('notification');
let habitChart;

const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-api-service.onrender.com';

const articlesSection = document.getElementById('articles'); 

async function fetchQuote() {
    try {
        const response = await fetch('/quote'); 
        const quoteData = await response.json();
        if (quoteData.text && quoteData.author) {
            const quoteText = quoteData.text;
            const quoteAuthor = quoteData.author;

            document.getElementById('daily-quote').innerHTML = "${quoteText}" - <strong>${quoteAuthor}</strong>;
        } else {
            document.getElementById('daily-quote').innerText = "Failed to load quote.";
        }
    } catch (error) {
        console.error('Error fetching quote:', error);
        document.getElementById('daily-quote').innerText = "Failed to load quote.";
    }
}

async function fetchArticles() {
    try {
        const response = await fetch('/articles'); 
        const articles = await response.json();

        if (articles.length > 0) {
            articlesSection.innerHTML = ''; 
            articles.forEach(article => {
                const articleElement = document.createElement('div');
                articleElement.classList.add('article');
                articleElement.innerHTML = `
                    <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
                    <p>${article.description}</p>
                    <small>Source: ${article.source.name}</small>
                `;
                articlesSection.appendChild(articleElement);
            });
        } else {
            articlesSection.innerHTML = '<p>No articles available at the moment.</p>';
        }
    } catch (error) {
        console.error('Error fetching articles:', error);
        articlesSection.innerHTML = '<p>Failed to load articles.</p>';
    }
}

window.onload = function() {
    fetchQuote(); 
    fetchArticles(); 
};

// Function to show the notification
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.classList.add('show', type);

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show', type);
    }, 3000);
}

addHabitBtn.addEventListener('click', () => {
    const habitName = habitNameInput.value;
    const habitFrequency = habitFrequencyInput.value;
    const habitCategory = habitCategoryInput.value;
    const habitGoal = habitGoalInput.value;

    console.log('Habit details to be added:', { habitName, habitFrequency, habitCategory, habitGoal }); // Debug log

    if (habitName) {
        fetch('${BASE_URL}/addHabit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: habitName, frequency: habitFrequency, category: habitCategory, goal: habitGoal })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Add Habit response:', data); // Debug log
            showNotification(data.message, 'success');
            fetchHabits(); // Reload habits
        })
        .catch(error => {
            console.error('Error adding habit:', error);
            showNotification('Failed to add habit. Please try again.', 'error');
        });
    } else {
        showNotification('Please enter a habit name.', 'error');
    }
});
// Update habit progress
function updateProgress(habitName, completed) {
    fetch('${BASE_URL}/updateProgress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitName, completed })
    })
    .then(response => response.json())
    .then(data => {
        showNotification(data.message, 'success');
        fetchHabits(); // Reload the habits
    })
    .catch(() => {
        showNotification('Failed to update progress. Please try again.', 'error');
    });
}

// Delete a habit
function deleteHabit(habitName) {
    fetch('${BASE_URL}/deleteHabit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitName })
    })
    .then(response => response.json())
    .then(data => {
        showNotification(data.message, 'success');
        fetchHabits(); // Reload the habits after deletion
    })
    .catch(() => {
        showNotification('Failed to delete habit. Please try again.', 'error');
    });
}

function updateChart(habits) {
    console.log('Habits data for chart:', habits); 
    const ctx = document.getElementById('habitChart').getContext('2d');
    const habitNames = habits.map(habit => habit.name);
    const habitStreaks = habits.map(habit => habit.streak);

    console.log('Chart labels:', habitNames); 
    console.log('Chart data:', habitStreaks); 


    if (habitChart) {
        habitChart.destroy(); 
    }

    habitChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: habitNames,
            datasets: [{
                label: 'Habit Streaks (days)',
                data: habitStreaks,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1 
                    }
                }
            }
        }
    });
}

function fetchHabits() {
    fetch('${BASE_URL}/getHabits')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch habits');
            return response.json();
        })
        .then(habits => {
            console.log('Fetched habits:', habits); // Debug log
            habitList.innerHTML = ''; // Clear current list
            habits.forEach(habit => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${habit.name}</td>
                    <td>${habit.frequency}</td>
                    <td>${habit.category}</td>
                    <td>${habit.goal}</td>
                    <td>${habit.streak} days</td>
                    <td>
                        <button onclick="updateProgress('${habit.name}', true)">Complete</button>
                        <button onclick="updateProgress('${habit.name}', false)">Miss</button>
                        <button onclick="deleteHabit('${habit.name}')">Delete</button>
                    </td>
                `;
                habitList.appendChild(tr);
            });
            updateChart(habits);
        })
        .catch(error => console.error('Error fetching habits:', error));
}
// Initial fetch of habits
fetchHabits();
