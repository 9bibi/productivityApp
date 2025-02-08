const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const axios = require('axios');
const fs = require('fs');
const User = require('./models/user');
const Quiz = require("./models/Quiz");
const WellnessTip = require('./models/WellnessTip');

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
app.use(session({ secret: "secretKey", resave: false, saveUninitialized: true }));
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

app.get("/register", (req, res) => {
    res.render("register", { error: req.query.error || null });
});

app.post("/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.render("register", { error: "Username already taken" });
    }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        isAdmin: false,
      });
      await newUser.save();
      
      return res.redirect("/login");
    } catch (error) {
        res.status(500).render("register", { error: "Server error. Please try again." });
    }
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
    const users = await User.find({ deletedAt: null });
    const wellnessTips = await WellnessTip.find({ deletedAt: null });
    const username = req.session.user.username;
    const isAdminUser = req.session.user && req.session.user.isAdmin;
    res.render('admin', { users, wellnessTips, username, isAdminUser });
});

app.post('/admin/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { username, password, isAdmin } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ username, password: hashedPassword, isAdmin });

        return res.redirect('/admin'); 
    } catch (error) {
        console.error("Error adding user:", error);
        return res.status(500).send("Error adding user");
    }
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
    try {
        const { id } = req.params;
        await User.findByIdAndUpdate(id, { deletedAt: new Date() });

        return res.redirect('/admin');
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).send("Error deleting user");
    }
});

app.get('/', isAuthenticated, async (req, res) => {
    const isAdminUser = req.session.user && req.session.user.isAdmin;
    const wellnessTips = await WellnessTip.find({ deletedAt: null });
    res.render('index', { username: req.session.user.username, isAdminUser, wellnessTips});
});

// MongoDB Schema for time entries
const timeEntrySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sessionType: { type: String, required: true }, // 'work' or 'break'
    duration: { type: Number, required: true }, // duration in seconds
    timestamp: { type: Date, default: Date.now },
    togglEntryId: { type: String, required: true } // Store Toggl entry ID
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

// Toggl API Token 
const togglApiToken = '5497ef2d33be904c06d8c5ea5d26bd91';
const togglWorkspaceId = '8368585';

// FreeSound API function
const getAmbientSounds = async (query) => {
    try {
        const response = await axios.get('https://freesound.org/apiv2/search/text/', {
            headers: { Authorization: `Token yKifXdSQm4TevvjGj60iSMDE0gNur0mYU7yhP8Ph` }, 
            params: {
                query: query,
                fields: 'id,name,previews',
            },
        });
        if (!response.data || !response.data.results) {
            console.error("Invalid response from FreeSound API");
            return [];
        }
        
        return response.data.results.map(sound => ({
            name: sound.name,
            url: sound.previews["preview-hq-mp3"]
        }));
        
    } catch (error) {
        console.error('Error fetching sounds:', error);
        return [];
    }
};

app.get('/api/sounds', async (req, res) => {
    const query = req.query.q || 'ambient'; // Default to 'ambient' if no query is provided
    console.log("Received request to /api/sounds with query:", query);


    try {
        const sounds = await getAmbientSounds(query);
        console.log("Fetched sounds:", sounds);
        res.json(sounds);
    } catch (error) {
        console.error("Error fetching sounds:", error);
        res.status(500).json({ error: 'Failed to fetch sounds' });
    }
});


// Route to handle sound selection
app.post('/play-sound', async (req, res) => {
    const { sound } = req.body;

    try {
        const sounds = await getAmbientSounds();
        const selectedSound = sounds.find(s => s.name === sound);

        if (selectedSound) {
            res.json({ success: true, url: selectedSound.url });
        } else {
            res.json({ success: false, message: "Sound not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching sounds" });
    }
});

app.get('/timer', (req, res) => {
    const username = req.session.user ? req.session.user.username : null; 
    const isAdminUser = req.session.user && req.session.user.isAdmin;

    res.render('homeTimer', { username, isAdminUser }); 
  });
  

// Start timer route (Toggl API)
app.post('/timer/start', (req, res) => {
    const { userId, sessionType } = req.body;

    // Start time entry with Toggl
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
            password: 'api_token', // Using your Toggl API token for basic auth
        }
    })
    .then(response => {
        const togglEntryId = response.data.data.id;

        // Save entry in MongoDB with Toggl entry ID
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

// Stop timer route (Toggl API)
app.post('/timer/stop', (req, res) => {
    const { timeEntryId } = req.body;

    // Stop the time entry with Toggl
    axios.put(`https://api.track.toggl.com/api/v8/time_entries/${timeEntryId}/stop`, {}, {
        auth: {
            username: togglApiToken,
            password: 'api_token',
        }
    })
    .then(response => {
        // Update duration in MongoDB (fetch the duration from Toggl response)
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

// Serve the search page when the user first visits the /search route
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


// Render the book search page (GET)
app.get("/books", (req, res) => {
    const q = "";  // Default value for query
    const author = "";  // Default value for author
    const language = "";  // Default value for language
    const subject = "";  // Default value for subject
    const page = 1;  // Default page value

    res.render("books", {
        books: [],
        query: q,
        author,
        language,
        subject,
        page,
        error: null  // No error message initially
    });
});

// Handle book search (GET & POST)
app.all("/books/search", async (req, res) => {
    const { q, author, language, subject, page = 1 } = req.method === "POST" ? req.body : req.query;

    console.log("Received Search Query:", req.method, req.body || req.query);

    // Check if the search query is empty
    if (!q) {
        return res.render("books", {
            books: [],
            query: "",
            author: "",
            language: "",
            subject: "",
            page: 1,
            error: "Please enter a search term."
        });
    }

    try {
        const apiUrl = `https://gutendex.com/books/?search=${encodeURIComponent(q)}&author=${encodeURIComponent(author || "")}&languages=${encodeURIComponent(language || "")}&topic=${encodeURIComponent(subject || "")}&page=${page}`;
        console.log("Fetching data from API:", apiUrl);

        const response = await axios.get(apiUrl);
        console.log("API Response:", response.data);

        const books = response.data.results.map(book => ({
            title: book.title,
            authors: book.authors.map(author => author.name).join(", "),
            language: book.languages.join(", "),
            subjects: book.subjects ? book.subjects.join(", ") : "No subjects",
            link: book.formats["text/html"] || book.formats["application/pdf"] || "No link available"
        }));

        // If no books are found, set error message
        const error = books.length === 0 ? "No books found for your search." : null;

        res.render("books", {
            books: books,
            query: q,
            author,
            language,
            subject,
            page,
            prevPage: response.data.previous ? parseInt(page) - 1 : null,
            nextPage: response.data.next ? parseInt(page) + 1 : null,
            error: error // Pass error if no books were found
        });
    } catch (error) {
        console.error("Error fetching books:", error);
        res.render("books", {
            books: [],
            query: q,
            author,
            language,
            subject,
            page,
            error: "Failed to fetch books."
        });
    }
});
app.get("/bonus", (req, res) => {
    res.render("bonus");
});
// Render Quiz Page
app.get("/quiz", async (req, res) => {
    try {
        const quizQuestions = await Quiz.find(); // Fetch questions from MongoDB
        console.log("Fetched quiz questions:", quizQuestions); // Debugging
        res.render("quiz", { quizQuestions }); // ✅ Pass `quizQuestions` to EJS
    } catch (err) {
        console.error("Error fetching questions:", err);
        res.status(500).send("Error loading quiz");
    }
});

// Submit Quiz
app.post("/submit-quiz", async (req, res) => {
    let score = 0;
    const userAnswers = req.body;

    const quizQuestions = await Quiz.find({});
    quizQuestions.forEach((question) => {
        if (userAnswers[question._id] === question.correctAnswer) {
            score++;
        }
    });

    res.redirect(`/result?score=${score}`);
});

// Show Result & Social Sharing
app.get("/result", (req, res) => {
    const score = req.query.score;
    res.render("result", { score });
});

// Add a new wellness tip
app.post('/api/wellness-tips', async (req, res) => {
    try {
        const { images, name_en, name_ru, description_en, description_ru } = req.body;

        // Validate input
        if (!images || images.length !== 3 || !name_en || !name_ru || !description_en || !description_ru) {
            return res.status(400).json({ message: 'Invalid input. Please provide all required fields.' });
        }

        const newWellnessTip = new WellnessTip({
            images,
            name_en,
            name_ru,
            description_en,
            description_ru,
        });

        await newWellnessTip.save();

        res.status(201).json({
            message: 'Wellness tip added successfully!',
            data: newWellnessTip,
        });
    } catch (error) {
        console.error('Error adding wellness tip:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// Edit an existing wellness tip
app.put('/api/wellness-tips/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { images, name_en, name_ru, description_en, description_ru } = req.body;

        // Validate input
        if (!images || images.length !== 3 || !name_en || !name_ru || !description_en || !description_ru) {
            return res.status(400).json({ message: 'Invalid input. Please provide all required fields.' });
        }

        const updatedWellnessTip = await WellnessTip.findByIdAndUpdate(
            id,
            {
                images,
                name_en,
                name_ru,
                description_en,
                description_ru,
                updatedAt: Date.now(),
            },
            { new: true } // Return the updated document
        );

        if (!updatedWellnessTip) {
            return res.status(404).json({ message: 'Wellness tip not found.' });
        }

        res.status(200).json({
            message: 'Wellness tip updated successfully!',
            data: updatedWellnessTip,
        });
    } catch (error) {
        console.error('Error updating wellness tip:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// Delete a wellness tip (soft delete)
app.delete('/api/wellness-tips/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedWellnessTip = await WellnessTip.findByIdAndUpdate(
            id,
            { deletedAt: Date.now() },
            { new: true } // Return the updated document
        );

        if (!deletedWellnessTip) {
            return res.status(404).json({ message: 'Wellness tip not found.' });
        }

        res.status(200).json({
            message: 'Wellness tip deleted successfully!',
            data: deletedWellnessTip,
        });
    } catch (error) {
        console.error('Error deleting wellness tip:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// Get all wellness tips (excluding deleted ones)
app.get('/api/wellness-tips', async (req, res) => {
    try {
        const wellnessTips = await WellnessTip.find({ deletedAt: null });

        res.status(200).json({
            message: 'Wellness tips retrieved successfully!',
            data: wellnessTips,
        });
    } catch (error) {
        console.error('Error retrieving wellness tips:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

const { Translate } = require("@google-cloud/translate").v2;

app.get("/translate", async (req, res) => {
    const { text, lang } = req.query;
    const API_KEY = "AIzaSyAW6r3EIIi1CrdCOgNvrFgI8A4xBBDEaZc"; 

    if (!text || !lang) {
        return res.status(400).json({ error: "Missing text or language" });
    }

    try {
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2`,
            {},
            {
                params: {
                    q: text,
                    target: lang,
                    key: API_KEY,
                },
            }
        );

        if (!response.data || !response.data.data || !response.data.data.translations) {
            throw new Error("Invalid API response");
        }

        const translatedText = response.data.data.translations[0].translatedText;
        res.json({ translation: translatedText });

    } catch (error) {
        console.error("Translation API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Translation failed" });
    }
});




// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
