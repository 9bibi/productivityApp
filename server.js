const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const User = require('./models/user');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();



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
app.set('views', path.join(__dirname, 'views'));  
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
    const { city } = req.query; 
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
    console.log('Received habit data:', req.body); 
    const { name, frequency, category, goal } = req.body;
    const habit = { name, frequency, category, goal, streak: 0, completedDays: 0, progress: [] };
    habits.push(habit);
    console.log('Updated habits:', habits); 
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



// MongoDB Schema for time entries
const timeEntrySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sessionType: { type: String, required: true }, 
    duration: { type: Number, required: true }, // duration in seconds
    timestamp: { type: Date, default: Date.now },
    togglEntryId: { type: String, required: true } 
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

const togglApiToken = '5497ef2d33be904c06d8c5ea5d26bd91';
const togglWorkspaceId = '8368585';

app.get('/timer', (req, res) => {
    const username = req.session.user ? req.session.user.username : null; 
    const isAdminUser = req.session.user && req.session.user.isAdmin;
    res.render('homeTimer', { username, isAdminUser }); 
  });
  

// Start timer route 
app.post('/timer/start', (req, res) => {
    const { userId, sessionType } = req.body;

    axios.post('https://api.track.toggl.com/api/v8/time_entries/start', {
        time_entry: {
            description: `${sessionType} Pomodoro session`,
            workspace_id: togglWorkspaceId,
            tags: ['Pomodoro'],
            created_with: 'habit-tracker',
        },
    }, {
        auth: {
            username: togglApiToken,
            password: 'api_token', 
        }
    })
    .then(response => {
        const togglEntryId = response.data.data.id;

        const timeEntry = new TimeEntry({
            userId,
            sessionType,
            duration: 0, // duration will be updated later when stopped
            togglEntryId,
        });

        timeEntry.save().then(() => {
            res.send('Time entry started');
        }).catch(err => {
            res.status(500).send('Error saving to database');
        });
    })
    .catch(err => {
        res.status(500).send('Error starting time entry');
    });
});

// Stop timer route 
app.post('/timer/stop', (req, res) => {
    const { timeEntryId } = req.body;

    axios.put(`https://api.track.toggl.com/api/v8/time_entries/${timeEntryId}/stop`, {}, {
        auth: {
            username: togglApiToken,
            password: 'api_token',
        }
    })
    .then(response => {
        const duration = response.data.data.duration;

        TimeEntry.findOneAndUpdate({ togglEntryId: timeEntryId }, { duration })
            .then(() => res.send('Time entry stopped'))
            .catch(err => res.status(500).send('Error updating database'));
    })
    .catch(err => {
        res.status(500).send('Error stopping time entry');
    });
});

const imageSchema = new mongoose.Schema({
    keyword: String,
    images: Array,
    timestamp: { type: Date, default: Date.now },
  });
  
const Image = mongoose.model('Image', imageSchema);

const PEXELS_API_KEY = 'lUP5dA2HJTkoRiMagadoQf8qFC6tJbEyr86DCNqn1Xmnj9EbyZP4YwTw'; // Pexels API key
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';


app.get('/search', (req, res) => {
    res.render('search', { images: [], keyword: '' });
  });
  
app.post('/search', async (req, res) => {
    const keyword = req.body.keyword;
  
    try {
      const response = await axios.get(PEXELS_API_URL, {
        headers: { Authorization: PEXELS_API_KEY },
        params: { query: keyword, per_page: 10 },
      });
  
      const images = response.data.photos.map(photo => photo.src.original);
  
      // Save search data to MongoDB
      const newSearch = new Image({
        keyword,
        images,
      });
      await newSearch.save();
  
      // Render the search page with images
      res.render('search', { images, keyword });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving images.');
    }
  });
  
  app.get('/history', async (req, res) => {
    try {
      const history = await Image.find().sort({ timestamp: -1 });
      res.render('history', { history });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving history.');
    }
  });
  
// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
