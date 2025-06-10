document.addEventListener("DOMContentLoaded", function () {
	// Get navigation elements
	const navLinks = document.querySelectorAll(".navbar .nav-link");
	const sections = document.querySelectorAll(".section");

	// Function to update active nav based on scroll position
	function updateActiveNav() {
		let current = "home"; // Default to home

		sections.forEach((section) => {
			const rect = section.getBoundingClientRect();
			// Check if section is in viewport (center of screen)
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

			// Remove active from all
			navLinks.forEach((l) => l.classList.remove("active"));
			// Add active to clicked
			this.classList.add("active");

			// Scroll to target
			const target = document.querySelector(this.getAttribute("href"));
			if (target) {
				// Special handling for services section to center on image
				if (this.getAttribute("href") === "#services") {
					const servicesImage = target.querySelector(".services-img");
					if (servicesImage) {
						const imageRect = servicesImage.getBoundingClientRect();
						const targetY = window.pageYOffset + imageRect.top - window.innerHeight / 2 + imageRect.height / 2;
						window.scrollTo({ top: targetY, behavior: "smooth" });
					} else {
						target.scrollIntoView({ behavior: "smooth", block: "center" });
					}
				} else {
					target.scrollIntoView({ behavior: "smooth", block: "center" });
				}
			}
		});
	});

	// Initialize navigation on load
	updateActiveNav();
	window.addEventListener("scroll", updateActiveNav);
});
