const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");

const mongoURI = 'mongodb+srv://ayala0852580:OBaHXAY4gCZyN8hG@cluster0.tnwec.mongodb.net/HabitTracker?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

const seedQuestions = [
    {
        question: "Why is it important to track your habits?",
        options: [
            "To understand progress and improve",
            "To waste time",
            "To avoid responsibility",
            "To compare with others"
        ],
        correctAnswer: "To understand progress and improve",
        category: "Habit Tracking",
        difficulty: "Easy"
    },
    {
        question: "Which tool is commonly used for tracking habits?",
        options: ["Notebook", "Habit tracking app", "Sticky notes", "All of the above"],
        correctAnswer: "All of the above",
        category: "Habit Tracking",
        difficulty: "Easy"
    },
    {
        question: "How many days does it usually take to build a new habit?",
        options: ["7 days", "21 days", "30 days", "66 days"],
        correctAnswer: "66 days",
        category: "Habit Tracking",
        difficulty: "Medium"
    },
    {
        question: "What is an effective way to stay consistent with a new habit?",
        options: [
            "Set a specific time for the habit",
            "Do it whenever you feel like it",
            "Change the habit every week",
            "Avoid tracking progress"
        ],
        correctAnswer: "Set a specific time for the habit",
        category: "Habit Tracking",
        difficulty: "Medium"
    },
    {
        question: "Which of these is an example of a healthy daily habit?",
        options: [
            "Drinking water regularly",
            "Checking social media all day",
            "Skipping meals",
            "Sleeping less than 4 hours"
        ],
        correctAnswer: "Drinking water regularly",
        category: "Habit Tracking",
        difficulty: "Easy"
    },
    {
        question: "What is the 'cue-routine-reward' model used for?",
        options: [
            "Breaking bad habits",
            "Understanding and building good habits",
            "Avoiding new habits",
            "Tracking financial expenses"
        ],
        correctAnswer: "Understanding and building good habits",
        category: "Habit Tracking",
        difficulty: "Hard"
    },
    {
        question: "Which strategy helps in breaking a bad habit?",
        options: [
            "Replacing it with a positive habit",
            "Ignoring it",
            "Punishing yourself",
            "Telling no one about it"
        ],
        correctAnswer: "Replacing it with a positive habit",
        category: "Habit Tracking",
        difficulty: "Medium"
    }
];

async function seedDB() {
    try {
        await Quiz.deleteMany({});
        await Quiz.insertMany(seedQuestions);
        console.log("Database seeded with habit-tracking quiz questions!");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        mongoose.connection.close();
    }
}

seedDB();
