// Simple script for the rhino.training website

document.addEventListener('DOMContentLoaded', () => {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without refreshing the page
        history.pushState(null, null, targetId);
      }
    });
  });
  
  // Simple animation for the logo (optional)
  const logo = document.querySelector('.logo-large');
  if (logo) {
    logo.style.opacity = '0';
    logo.style.transition = 'opacity 1s ease-in-out';
    
    setTimeout(() => {
      logo.style.opacity = '1';
    }, 300);
  }
  
  // You can add more interactivity here if needed
});

// Optional: Simple mobile menu toggle if you decide to implement it
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('show-mobile');
}
