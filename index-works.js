// Fixed beta works. Replace the text later when the final descriptions are approved.
const PINNED_WORKS = [
  { title: 'জাতীয় পতাকার সম্মান রক্ষা', category: 'নাগরিক দায়িত্ব', image: 'images/national-flag-respect.jpg', summary: 'চাঁচল শহরের বিভিন্ন স্থানে অবনমিত জাতীয় পতাকা খুলে সম্মান রক্ষার উদ্যোগ।', detailsUrl: 'national-flag-respect.html' },
  { title: 'শিক্ষক দীপক চ্যাটার্জীর হাত ধরে ছাত্রছাত্রীদের হৃদয়ে দেশপ্রেমের জাগরণ', category: 'শিক্ষা', image: 'images/student-patriotism.jpg', summary: 'ছাত্রছাত্রীদের নিয়ে চাঁচল শহরের দ্রষ্টব্য স্থান ঘুরে বাস্তবসম্মত শিক্ষার উদ্যোগ।', detailsUrl: 'student-patriotism.html' },
  { title: 'দীপক চ্যাটার্জীর ১০ বছরের নিরলস যোগা যাত্রা', category: 'শিক্ষা ও স্বাস্থ্য', image: 'images/ten-years-yoga.jpg', summary: 'গত এক দশক ধরে বিদ্যালয়ের ছাত্রছাত্রীদের নিয়মিত যোগাভ্যাস শেখানোর প্রচেষ্টা।', detailsUrl: 'ten-years-yoga.html' }
];

const $ = selector => document.querySelector(selector);

// Creates a compact card that links to its own hardcoded detail page.
function workCard(work) {
  return `<article class="group bg-navy-800 rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-colors grid">
    <a href="${work.detailsUrl}" class="block overflow-hidden"><img src="${work.image}" alt="${work.title}" class="w-full h-52 object-cover group-hover:scale-[1.02] transition-transform"></a>
    <div class="p-5 flex flex-col">
      <p class="text-xs font-semibold text-saffron mb-2">${work.category}</p>
      <h3 class="font-display text-lg text-white leading-snug mb-2">${work.title}</h3>
      <p class="text-sm text-paper-100/70 leading-relaxed mb-4">${work.summary}</p>
      <a href="${work.detailsUrl}" class="mt-auto text-sm font-semibold text-saffron hover:underline">Read More &rarr;</a>
    </div>
  </article>`;
}

// Render the three fixed cards. There is intentionally no carousel or timer.
$('#notable-works').innerHTML = PINNED_WORKS.map(work => workCard(work)).join('');

// Mobile navigation.
const menuButton = $('#menu-btn'), mobileMenu = $('#mobile-menu');
function setMenu(open) {
  mobileMenu.classList.toggle('hidden', !open);
  $('#menu-icon-open').classList.toggle('hidden', open);
  $('#menu-icon-close').classList.toggle('hidden', !open);
  menuButton.setAttribute('aria-expanded', String(open));
}
menuButton.addEventListener('click', () => setMenu(mobileMenu.classList.contains('hidden')));
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));

// Grievance form validation and its existing demonstration submission.
const form = $('#grievance-form'), description = $('#description');
const fields = {
  full_name: [$('#full-name'), value => value.trim().length >= 2],
  phone: [$('#phone'), value => /^[6-9]\d{9}$/.test(value.trim().replace(/\D/g, ''))],
  location: [$('#location'), value => value.trim().length >= 2],
  category: [$('#category'), value => value.trim().length > 0],
  description: [description, value => value.trim().length >= 20]
};
function showError(input, visible) {
  input.closest('div').querySelector('.field-error')?.classList.toggle('hidden', !visible);
  input.classList.toggle('border-rust', visible);
  input.classList.toggle('border-line', !visible);
}
function validateForm() {
  let validForm = true;
  Object.values(fields).forEach(([input, test]) => { const valid = test(input.value); showError(input, !valid); if (!valid) validForm = false; });
  return validForm;
}
Object.values(fields).forEach(([input, test]) => ['input', 'change'].forEach(type => input.addEventListener(type, () => { if (test(input.value)) showError(input, false); })));
description.addEventListener('input', () => {
  if (description.value.length > 1000) description.value = description.value.slice(0, 1000);
  $('#char-count').textContent = `${description.value.length} / 1000`;
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!validateForm()) return Object.values(fields).find(([input, test]) => !test(input.value))[0].focus();
  const button = $('#submit-btn'), label = $('#submit-label'), spinner = $('#submit-spinner');
  button.disabled = true; label.textContent = 'Submitting…'; spinner.classList.remove('hidden');
  try {
    // Replace this with Formspree or EmailJS when you are ready to receive real submissions.
    await new Promise(resolve => setTimeout(resolve, 900));
    $('#ref-number').textContent = `GRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    form.classList.add('hidden'); $('#success-state').classList.remove('hidden'); $('#success-state').setAttribute('tabindex', '-1'); $('#success-state').focus();
  } catch (error) {
    alert('Something went wrong submitting your complaint. Please try again or call the office directly.'); console.error(error);
  } finally { button.disabled = false; label.textContent = 'Submit Complaint'; spinner.classList.add('hidden'); }
});
$('#reset-form-btn').addEventListener('click', () => {
  form.reset(); $('#char-count').textContent = '0 / 1000';
  Object.values(fields).forEach(([input]) => showError(input, false));
  $('#success-state').classList.add('hidden'); form.classList.remove('hidden');
});

// Footer year.
$('#year').textContent = new Date().getFullYear();
