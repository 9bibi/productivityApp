const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const User = require('./models/user');
const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs');
const Event = require('./models/event');
const ApiHistory = require('./models/apiHistory');


// MongoDB Atlas connection
const mongoURI = 'mongodb+srv://ayala0852580:OBaHXAY4gCZyN8hG@cluster0.tnwec.mongodb.net/HabitTracker?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// Express app setup
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session setup
app.use(session({
    secret: 'qNUg>MseAS,*GLJ6Zb3~&[',
    resave: false,
    saveUninitialized: false,
}));

// Middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.isAdmin) return next();
    res.redirect('/');
}

app.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy');
});


// Routes
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');  // Redirect to the main page if already logged in
    }
    res.render('login', { error: req.query.error || null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!username || !password) {
        return res.redirect('/login?error=Invalid username or password');
    }
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render('login', { error: 'Invalid username or password' });
    }
    
    // Set session for both admin and regular users
    req.session.user = { id: user._id, username: user.username, isAdmin: user.isAdmin };

    // Redirect to appropriate page based on admin status
    if (user.isAdmin) {
        return res.redirect('/admin');  // Admin dashboard route
    } else {
        return res.redirect('/');  // Redirect regular users to main page
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Weather API endpoint
app.get('/weather/data', async (req, res) => {
    const { city } = req.query; // City name passed as query parameter
    const apiKey = 'e8d7ebbdc114120d0381a62520b0720c';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        const weatherData = response.data;
        res.json(weatherData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.get('/weather', (req, res) => {
    const username = req.session.user ? req.session.user.username : null; 
    const isAdminUser = req.session.user && req.session.user.isAdmin;
    res.render('weather', { username, isAdminUser });
});

// Motivational Quote API using API Ninjas
app.get('/quote', async (req, res) => {
    const options = {
        method: 'GET',
        url: 'https://api.api-ninjas.com/v1/quotes',
        headers: {
            'X-Api-Key': 'YoYrVpiJ5OD5zn9YP3e+RQ==MJmdyPauqL0arxTp' 
        }
    };

    try {
        const response = await axios.request(options);
        const quote = response.data[0]; 
        res.json({ text: quote.quote, author: quote.author });
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});
// NewsAPI to fetch articles related to productivity and life
app.get('/articles', async (req, res) => {
    try {
        const response = await fetch('https://newsapi.org/v2/everything?q=productivity&apiKey=765c90c3f5bb425e8477d9bb99589f06');
        const data = await response.json();

        if (data.status === 'ok') {
            const articles = data.articles.slice(0, 3).map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source
            }));
            res.json(articles); 
        } else {
            res.status(500).json({ error: 'Failed to fetch articles' });
        }
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Error fetching articles from the API' });
    }
});
app.use(cors());
app.use(bodyParser.json());

let habits = []; // Array to store user habits
let progress = {}; // Object to store progress of habits

app.use(express.static(path.join(__dirname, 'public')));

app.post('/addHabit', (req, res) => {
    console.log('Received habit data:', req.body); // Debug log
    const { name, frequency, category, goal } = req.body;
    const habit = { name, frequency, category, goal, streak: 0, completedDays: 0, progress: [] };
    habits.push(habit);
    console.log('Updated habits:', habits); // Debug log
    res.status(200).json({ message: 'Habit added successfully!', habit });
});

app.get('/getHabits', (req, res) => {
    res.status(200).json(habits);
});

app.post('/updateProgress', (req, res) => {
    const { habitName, completed } = req.body;
    const habit = habits.find(h => h.name === habitName);
    if (habit) {
        if (completed) {
            habit.completedDays += 1;
            habit.streak += 1;
            habit.progress.push(new Date().toISOString().split('T')[0]); // Log the completion date
        } else {
            habit.streak = 0; // Reset streak if not completed
        }
        progress[habitName] = habit;
        res.status(200).json({ message: 'Progress updated successfully!', habit });
    } else {
        res.status(404).json({ message: 'Habit not found!' });
    }
});

app.delete('/deleteHabit', (req, res) => {
    const { habitName } = req.body;
    console.log('Deleting habit:', habitName); 
    habits = habits.filter(h => h.name !== habitName);
    console.log('Updated habits list:', habits); 
    res.status(200).json({ message: 'Habit deleted successfully!' });
});

app.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    const users = await User.find();
    const username = req.session.user.username;
    const isAdminUser = req.session.user && req.session.user.isAdmin;
    res.render('admin', { users, username, isAdminUser });
});

app.post('/admin/add', isAuthenticated, isAdmin, async (req, res) => {
    const { username, password, isAdmin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, isAdmin });
    res.redirect('/admin');
});

app.post('/admin/edit/:id', async (req, res) => {
    try {
        const { username, isAdmin } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                username: username,
                isAdmin: isAdmin === 'on' ? true : false, // Convert 'on' to true, other values to false
            },
            { new: true }
        );

        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user');
    }
});

app.post('/admin/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { deletedAt: new Date() });
    res.redirect('/admin');
});

app.get('/', isAuthenticated, (req, res) => {
    const isAdminUser = req.session.user && req.session.user.isAdmin;
    res.render('index', { username: req.session.user.username, isAdminUser });
});

// Load client secrets
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'client_secret.json')));

// Create OAuth client
const oAuth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

// Google Calendar API Integration
app.get('/auth/google', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });
  res.redirect(authUrl);
});


// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
