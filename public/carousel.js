// Carousel functionality
document.querySelectorAll('.carousel').forEach(carousel => {
    const images = carousel.querySelectorAll('.carousel-image');
    let currentIndex = 0;

    // Show the current image
    const showImage = (index) => {
        images.forEach((image, i) => {
            image.classList.toggle('active', i === index);
        });
    };

    // Next button
    carousel.querySelector('.carousel-next').addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    });

    // Previous button
    carousel.querySelector('.carousel-prev').addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
    });
});