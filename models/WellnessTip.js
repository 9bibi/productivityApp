const mongoose = require('mongoose');

const wellnessTipSchema = new mongoose.Schema({
    images: [String], // Array of 3 image URLs
    name_en: String,  // Name in English
    name_ru: String,  // Name in Russian
    description_en: String, // Description in English
    description_ru: String, // Description in Russian
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: null }, // Update timestamp
    deletedAt: { type: Date, default: null }, // Deletion timestamp
});

const WellnessTip = mongoose.model('WellnessTip', wellnessTipSchema);

module.exports = WellnessTip;