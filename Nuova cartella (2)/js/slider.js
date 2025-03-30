// Configuration du slider
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector(".slider");
    const slides = document.querySelectorAll(".slide");
    const prevBtn = document.getElementById("prev-slide");
    const nextBtn = document.getElementById("next-slide");
    const scrollbarThumb = document.querySelector(".scrollbar-thumb");
    
    let currentIndex = 0;
    const slideCount = slides.length;
    
    // Initialisation
    updateSlider();
    
    // Événements
    prevBtn.addEventListener("click", () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : slideCount - 1;
        updateSlider();
    });
    
    nextBtn.addEventListener("click", () => {
        currentIndex = (currentIndex < slideCount - 1) ? currentIndex + 1 : 0;
        updateSlider();
    });
    
    // Barre de défilement
    scrollbarThumb.addEventListener("click", (e) => {
        const trackWidth = scrollbarThumb.parentElement.offsetWidth;
        const clickPosition = e.clientX - scrollbarThumb.parentElement.getBoundingClientRect().left;
        const thumbPosition = (clickPosition / trackWidth) * 100;
        
        currentIndex = Math.min(slideCount - 1, Math.floor((thumbPosition / 100) * slideCount));
        updateSlider();
    });
    
    // Mise à jour automatique
    let autoSlide = setInterval(() => {
        currentIndex = (currentIndex < slideCount - 1) ? currentIndex + 1 : 0;
        updateSlider();
    }, 5000);
    
    // Pause au survol
    slider.parentElement.addEventListener("mouseenter", () => {
        clearInterval(autoSlide);
    });
    
    slider.parentElement.addEventListener("mouseleave", () => {
        autoSlide = setInterval(() => {
            currentIndex = (currentIndex < slideCount - 1) ? currentIndex + 1 : 0;
            updateSlider();
        }, 5000);
    });
    
    function updateSlider() {
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Mise à jour de la barre de défilement
        const thumbWidth = 100 / slideCount;
        scrollbarThumb.style.width = `${thumbWidth}%`;
        scrollbarThumb.style.left = `${currentIndex * thumbWidth}%`;
    }
});