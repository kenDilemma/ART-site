console.log("Script file is loading...");

document.addEventListener("DOMContentLoaded", function () {
	console.log("DOM Content Loaded");

	// Simple test - add active class to Home on load
	const homeLink = document.querySelector('a[href="#home"]');
	if (homeLink) {
		homeLink.classList.add("active");
		console.log("Added active class to home link");
	}

	// Get navigation elements
	const navLinks = document.querySelectorAll(".navbar .nav-link");
	const sections = document.querySelectorAll(".section");

	console.log("Nav links found:", navLinks.length);
	console.log("Sections found:", sections.length);

	// Function to update active nav based on scroll position
	function updateActiveNav() {
		let current = "home"; // Default to home

		sections.forEach((section) => {
			const rect = section.getBoundingClientRect();
			// Check if section is in viewport (top half of screen)
			if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
				current = section.getAttribute("id");
			}
		});

		// Update nav links
		navLinks.forEach((link) => {
			link.classList.remove("active");
			if (link.getAttribute("href") === "#" + current) {
				link.classList.add("active");
			}
		});
	}

	// Click event for nav links
	navLinks.forEach((link) => {
		link.addEventListener("click", function (e) {
			e.preventDefault();
			console.log("Clicked:", this.textContent);

			// Remove active from all
			navLinks.forEach((l) => l.classList.remove("active"));
			// Add active to clicked
			this.classList.add("active");

			// Scroll to target
			const target = document.querySelector(this.getAttribute("href"));
			if (target) {
				target.scrollIntoView({ behavior: "smooth" });
			}
		});
	});

	// Initial call and scroll listener
	updateActiveNav();
	window.addEventListener("scroll", updateActiveNav);
});
