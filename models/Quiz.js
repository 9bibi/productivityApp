const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: String,
    category: String,
    difficulty: String
});

module.exports = mongoose.model("Quiz", quizSchema);
