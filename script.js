console.log("Script is running!");

document.addEventListener("DOMContentLoaded", function () {
	// Get navigation elements
	const navLinks = document.querySelectorAll(".navbar .nav-link");
	const sections = document.querySelectorAll(".section");

	// Function to update active nav based on scroll position
	function updateActiveNav() {
		console.log("Scroll event triggered.");
		let current = "";

		sections.forEach((section) => {
			const sectionTop = section.offsetTop - 100; // Adjust for navbar height
			const sectionBottom = sectionTop + section.offsetHeight;
			console.log(`Checking section: ${section.id}, Top: ${sectionTop}, Bottom: ${sectionBottom}`);
			if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
				current = section.getAttribute("id");
				console.log(`Current section: ${current}`);
			}
		});

		navLinks.forEach((link) => {
			link.classList.remove("active");
			if (link.getAttribute("href") === `#${current}`) {
				link.classList.add("active");
				console.log(`Active link: ${link.getAttribute("href")}`);
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

// Example HTML structure for navigation
const navHTML = `
<ul class="nav-links">
	<li><a href="#home" class="nav-link">Home</a></li>
	<li><a href="#about" class="nav-link active">About</a></li>
	<li><a href="#services" class="nav-link">Services</a></li>
	<li><a href="#contact" class="nav-link">Contact</a></li>
</ul>
`;

document.body.insertAdjacentHTML("afterbegin", navHTML);
