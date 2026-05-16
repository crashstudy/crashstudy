document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Custom Cursor Logic ---
    const cursorDot = document.querySelector(".cursor-dot");
    const cursorOutline = document.querySelector(".cursor-outline");

    // Only run custom cursor on non-touch devices
    if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener("mousemove", (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        const hoverElements = document.querySelectorAll('a, button, .tilt-card');
        hoverElements.forEach(el => {
            el.addEventListener("mouseenter", () => {
                cursorOutline.style.width = "60px";
                cursorOutline.style.height = "60px";
                cursorOutline.style.backgroundColor = "rgba(0, 240, 255, 0.1)";
            });
            el.addEventListener("mouseleave", () => {
                cursorOutline.style.width = "40px";
                cursorOutline.style.height = "40px";
                cursorOutline.style.backgroundColor = "transparent";
            });
        });
    }

    // --- 2. Preloader Removal ---
    const loader = document.getElementById("loader");
    window.addEventListener("load", () => {
        setTimeout(() => {
            if(loader) {
                loader.style.opacity = "0";
                setTimeout(() => {
                    loader.style.display = "none";
                    reveal();
                }, 500);
            }
        }, 1000); 
    });

    // --- 3. Sticky Navbar ---
    const navbar = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.style.padding = "10px 5%";
            navbar.style.background = "rgba(7, 9, 19, 0.98)";
        } else {
            navbar.style.padding = "20px 5%";
            navbar.style.background = "rgba(7, 9, 19, 0.8)";
        }
    });

    // --- 4. 3D Tilt Effect ---
    const tiltCards = document.querySelectorAll(".tilt-card");
    if (window.matchMedia("(pointer: fine)").matches) {
        tiltCards.forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; 
                const y = e.clientY - rect.top;  
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -10; 
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                card.style.transition = "transform 0.5s ease"; 
            });
            
            card.addEventListener("mouseenter", () => {
                card.style.transition = "none"; 
            });
        });
    }

    // --- 5. Scroll Reveal Animation ---
    const reveals = document.querySelectorAll(".reveal");
    function reveal() {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        reveals.forEach(revealElement => {
            const elementTop = revealElement.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                revealElement.classList.add("active");
            }
        });
    }
    window.addEventListener("scroll", reveal);

    // --- 6. Number Counter Animation ---
    const counters = document.querySelectorAll('.counter');
    let counterActivated = false;

    function runCounters() {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000; 
            const increment = target / (duration / 16); 

            let current = 0;
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target;
                }
            };
            updateCounter();
        });
    }

    const statsSection = document.querySelector('.stats-section');
    window.addEventListener('scroll', () => {
        if (!counterActivated && statsSection) {
            const sectionTop = statsSection.getBoundingClientRect().top;
            if (sectionTop < window.innerHeight - 50) {
                runCounters();
                counterActivated = true;
            }
        }
    });

    // --- 7. MOBILE MENU TOGGLE (FIXED) ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
});
