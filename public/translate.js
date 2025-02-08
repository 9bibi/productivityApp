document.addEventListener("DOMContentLoaded", () => {
    const languageSelector = document.getElementById("language-selector");
    const savedLang = localStorage.getItem("selectedLang") || "en";

    languageSelector.value = savedLang;
    translatePage(savedLang);

    languageSelector.addEventListener("change", async () => {
        const selectedLang = languageSelector.value;
        localStorage.setItem("selectedLang", selectedLang);
        translatePage(selectedLang);
    });
});

async function translatePage(lang) {
    const elements = document.querySelectorAll("[data-translate], h1, h2, h3, p, span, button, a, #daily-quote, .article, label, input[placeholder], container");

    for (const element of elements) {
        let originalText = element.getAttribute("data-original-text") || element.textContent.trim();

        // Skip elements without meaningful text
        if (!originalText || originalText.length < 2) continue;

        try {
            const response = await fetch(`/translate?text=${encodeURIComponent(originalText)}&lang=${lang}`);
            const data = await response.json();

            if (data.translation) {
                element.setAttribute("data-original-text", originalText); // Store original text
                element.textContent = data.translation;
            }
        } catch (error) {
            console.error("Translation Error:", error);
        }
    }
}
