// DOM Elements
const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.querySelector('.sidebar');
const navLinks = document.querySelectorAll('.nav-links a');
const contactForm = document.getElementById('contactForm');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');

// Toggle Sidebar on Mobile
menuBtn.addEventListener('click', () => {
     sidebar.classList.toggle('active');
     menuBtn.innerHTML = sidebar.classList.contains('active') ? '✕' : '☰';
});

// Close sidebar when clicking on a nav link on mobile
navLinks.forEach(link => {
     link.addEventListener('click', () => {
          if (window.innerWidth <= 992) {
               sidebar.classList.remove('active');
               menuBtn.innerHTML = '☰';
          }
     });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
     anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
               window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
               });
          }
     });
});

// Form submission handler
if (contactForm) {
     contactForm.addEventListener('submit', function (e) {
          e.preventDefault();

          // Get form data
          const formData = new FormData(contactForm);
          const formObject = {};
          formData.forEach((value, key) => {
               formObject[key] = value;
          });

          // Here you would typically send the data to a server
          console.log('Form submitted:', formObject);

          // Show success message
          alert('Thank you for your message! We will get back to you soon.');
          contactForm.reset();
     });
}

// Sticky header on scroll
window.addEventListener('scroll', () => {
     const header = document.querySelector('.main-content');
     if (window.scrollY > 100) {
          header.style.paddingTop = '80px';
     } else {
          header.style.paddingTop = '0';
     }
});

// Active link highlighting on scroll
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
     let current = '';

     sections.forEach(section => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.clientHeight;

          if (pageYOffset >= (sectionTop - 300)) {
               current = section.getAttribute('id');
          }
     });

     navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${current}`) {
               link.classList.add('active');
          }
     });
});

// Initialize AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function () {
     // You can add AOS initialization here if you include the AOS library
     // AOS.init();

     // Mobile menu toggle
     const body = document.body;

     // Toggle sidebar when mobile menu button is clicked
     if (mobileMenuToggle) {
          mobileMenuToggle.addEventListener('click', function () {
               sidebar.classList.toggle('active');
               body.classList.toggle('sidebar-active');

               // Toggle between menu and close icon
               const icon = this.querySelector('i');
               if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
               }
          });
     }

     // Close sidebar when clicking outside on mobile
     document.addEventListener('click', function (e) {
          if (window.innerWidth <= 991 &&
               !sidebar.contains(e.target) &&
               !mobileMenuToggle.contains(e.target)) {
               sidebar.classList.remove('active');
               body.classList.remove('sidebar-active');

               // Reset menu icon
               const icon = mobileMenuToggle.querySelector('i');
               if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
               }
          }
     });

     // Update year in footer
     const yearElement = document.querySelector('.current-year');
     if (yearElement) {
          yearElement.textContent = new Date().getFullYear();
     }
});
