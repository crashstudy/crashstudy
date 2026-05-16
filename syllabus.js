document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ACCORDION LOGIC ---
    const accordions = document.querySelectorAll('.accordion-header');

    accordions.forEach(acc => {
        acc.addEventListener('click', function() {
            // Toggle the 'open' class on the parent item
            const item = this.parentElement;
            
            // Optional: Close other accordions when one opens
            // document.querySelectorAll('.accordion-item').forEach(other => {
            //     if(other !== item) other.classList.remove('open');
            // });

            item.classList.toggle('open');
            
            // Recalculate max-height dynamically for smooth transitions if subtopics change
            const body = item.querySelector('.accordion-body');
            if (item.classList.contains('open')) {
                body.style.maxHeight = body.scrollHeight + "px";
            } else {
                body.style.maxHeight = null;
            }
        });
    });

    // Handle initial heights for open elements if added dynamically
    window.addEventListener('resize', () => {
        document.querySelectorAll('.accordion-item.open .accordion-body').forEach(body => {
            body.style.maxHeight = body.scrollHeight + "px";
        });
    });


    // --- 2. MOBILE SIDEBAR TOGGLE ---
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if(menuToggle) menuToggle.addEventListener('click', openSidebar);
    if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if(overlay) overlay.addEventListener('click', closeSidebar);


    // --- 3. AI FLOATING WIDGET TOGGLE ---
    const aiTrigger = document.getElementById('aiTrigger');
    const aiChatPanel = document.getElementById('aiChatPanel');
    const closeChatBtn = document.getElementById('closeChat');

    if(aiTrigger) {
        aiTrigger.addEventListener('click', () => {
            aiChatPanel.classList.toggle('active');
        });
    }

    if(closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            aiChatPanel.classList.remove('active');
        });
    }


    // --- 4. SIMPLE SEARCH FILTER LOGIC (MOCK) ---
    const searchInput = document.getElementById('searchInput');
    
    if(searchInput) {
        searchInput.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const topics = document.querySelectorAll('.accordion-item');

            topics.forEach(topic => {
                const title = topic.querySelector('h4').textContent.toLowerCase();
                const desc = topic.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(term) || desc.includes(term)) {
                    topic.style.display = 'block';
                } else {
                    topic.style.display = 'none';
                }
            });
        });
    }
    
    // Smooth scrolling for quick jump links
    document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Close mobile sidebar if open
            closeSidebar();

            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

});
