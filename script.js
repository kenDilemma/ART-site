// Simple script for the rhino.training website

document.addEventListener("DOMContentLoaded", () => {
	// Get all navigation links and sections
	const navLinks = document.querySelectorAll(".nav-link");
	const sections = document.querySelectorAll(".section");

	// Smooth scrolling for anchor links
	navLinks.forEach((anchor) => {
		anchor.addEventListener("click", function (e) {
			e.preventDefault();

			const targetId = this.getAttribute("href");
			const targetElement = document.querySelector(targetId);

			if (targetElement) {
				targetElement.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});

				// Update URL without refreshing the page
				history.pushState(null, null, targetId);
			}
		});
	});

	// Set up IntersectionObserver to highlight current section in navbar
	const observerOptions = {
		root: null,
		rootMargin: "-20% 0px -80% 0px",
		threshold: 0,
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				// Get the id of the current section
				const id = entry.target.getAttribute("id");

				// Remove active class from all nav links
				navLinks.forEach((link) => {
					link.classList.remove("active");
				});

				// Add active class to the current nav link
				const currentNavLink = document.querySelector(`.nav-link[href="#${id}"]`);
				if (currentNavLink) {
					currentNavLink.classList.add("active");
				}
			}
		});
	}, observerOptions);

	// Observe all sections
	sections.forEach((section) => {
		observer.observe(section);
	});

	// Simple animation for the logo (optional)
	const logo = document.querySelector(".logo-large");
	if (logo) {
		logo.style.opacity = "0";
		logo.style.transition = "opacity 1s ease-in-out";

		setTimeout(() => {
			logo.style.opacity = "1";
		}, 300);
	}
});

// Optional: Simple mobile menu toggle if you decide to implement it
function toggleMobileMenu() {
	const navLinks = document.querySelector(".nav-links");
	navLinks.classList.toggle("show-mobile");
}
