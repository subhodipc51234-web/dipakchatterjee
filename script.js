// Portfolio data. Add or edit an entry here to update the works archive.
const WORKS_DATA = [
  ["Free Education & School Admissions for Underprivileged Children", "Education", "Ongoing, 20+ years", "Chanchal, North Malda", "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop", "Over his teaching career, Dipak has arranged school admissions and free education for many children from Dalit Rabidas, Charmakar, and other backward and marginalised communities, working to make sure background is never the reason a child is kept out of school."],
  ["Head Teacher, Government Primary School, Chanchal", "Education", "20+ year teaching career", "Chanchal, North Malda", "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop", "As Head Teacher, Dipak has been known for his leadership and dedication in school administration, introducing initiatives over two decades aimed at improving access and outcomes for students from the surrounding villages."],
  ["Blood Donation & Health Awareness Camps", "Social Welfare", "Ongoing", "Chanchal & North Malda", "https://images.unsplash.com/photo-1595768686435-2c8dda63af88?q=80&w=800&auto=format&fit=crop", "Regular blood donation drives and health and education awareness camps organised for underprivileged and marginalised residents across the Chanchal area."],
  ["First Point of Contact in Local Crises", "Social Welfare", "Ongoing", "Chanchal, North Malda", "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800&auto=format&fit=crop", "Dipak is regularly the first person local families turn to during disasters, accidents, and social crises, offering practical support and helping connect people to the right services."],
  ["Ram Mandir Construction Support", "Community Drives", "Multi-year effort", "North Malda district", "https://images.unsplash.com/photo-1608755728617-aefab37d2edd?q=80&w=800&auto=format&fit=crop", "Served as Cashier/Treasurer for Ram Mandir construction efforts across North Malda district, managing funds and logistics for the project."],
  ["Campaign for a Chanchal Hindu Hostel, Library & Rabindra Bhavan", "Community Drives", "Ongoing", "Chanchal, North Malda", "https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=800&auto=format&fit=crop", "Organised and led public movements calling for a Chanchal Hindu Hostel, a library, and a Rabindra Bhavan for the local community, pressing the case through rallies and public meetings."],
  ["Chhatrapati Shivaji Maharaj Statue, Taraltala More", "Community Drives", "Completed", "Taraltala More, Chanchal", "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=800&auto=format&fit=crop", "Played a key organising role in the installation of the Chhatrapati Shivaji Maharaj statue at Taraltala More, Chanchal, now a local landmark."],
  ["Ram Navami Celebration 2017 — Chief Organizer", "Community Drives", "2017", "Chanchal, North Malda", "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop", "Served as Chief Organizer for the 2017 Ram Navami celebrations in Chanchal, coordinating logistics, volunteers, and public participation for the event."],
  ["A Trusted Voice Against Corruption", "Press/Media", "Ongoing", "Facebook: @Dipak Chatterjee", "https://images.unsplash.com/photo-1560264357-8d9202250f21?q=80&w=800&auto=format&fit=crop", "Widely followed on Facebook, Dipak writes and speaks openly about corruption and injustice affecting ordinary people, regardless of political party or affiliation, and is a recognised face in local social media and TV discussions."],
  ["Public Advocacy on Regional Justice Cases", "Press/Media", "Recent", "North Malda & wider West Bengal", "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=800&auto=format&fit=crop&sat=-20", "Took part in public rallies and meetings raising awareness of the treatment of Hindu families in Dhulian, the situation facing Hindu communities in Bangladesh, and calling for justice in the RG Kar Hospital and Dolly Barman cases."]
].map(([title, category, date, location, image, description], index) => ({ id: index + 1, title, category, date, location, image, description }));

// Category icon and colour used in every work card.
const CATEGORY_META = {
  "Education": ["text-[#8FC7A8]", 'M12 14l9-5-9-5-9 5 9 5zm0 0v7m-9-5.5V17a9 9 0 0018 0v-5.5'],
  "Social Welfare": ["text-[#E8B15C]", 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'],
  "Community Drives": ["text-[#E08E76]", 'M15 19.128a9.4 9.4 0 002.625.372 9.3 9.3 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.3 12.3 0 018.624 21c-2.33 0-4.51-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z'],
  "Press/Media": ["text-[#93A9DB]", 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.7 0 1.4-.03 2.09-.09m0 9.18a18 18 0 01-.59-4.59c0-1.59.2-3.13.59-4.59m0 9.18a23.8 23.8 0 018.84 2.54M10.34 6.66a23.8 23.8 0 008.84-2.54']
};
const $ = (selector) => document.querySelector(selector);
const worksGrid = $('#works-grid'), worksEmpty = $('#works-empty'), modal = $('#work-modal');

function badge(category) {
  const [colour, path] = CATEGORY_META[category] || CATEGORY_META['Press/Media'];
  return `<span class="inline-flex items-center gap-1.5 text-xs font-semibold ${colour}"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${path}"/></svg>${category}</span>`;
}

// Draw filtered cards; the first card remains featured, as in the original.
function renderWorks(filter = 'All') {
  const items = filter === 'All' ? WORKS_DATA : WORKS_DATA.filter(item => item.category === filter);
  worksGrid.innerHTML = '';
  worksEmpty.classList.toggle('hidden', Boolean(items.length));
  items.forEach((item, index) => {
    const featured = index === 0;
    const card = document.createElement('article');
    card.dataset.id = item.id;
    card.className = featured
      ? 'group sm:col-span-2 grid sm:grid-cols-2 bg-navy-800 rounded-lg overflow-hidden border border-white/5 cursor-pointer hover:border-white/20 transition-colors'
      : 'group bg-navy-800 rounded-lg overflow-hidden border border-white/5 cursor-pointer hover:border-white/20 transition-colors flex flex-col';
    card.innerHTML = featured
      ? `<img src="${item.image}" alt="${item.title}" class="w-full h-56 sm:h-full object-cover"><div class="p-6 md:p-8 flex flex-col justify-center">${badge(item.category)}<h3 class="font-display text-2xl text-white leading-snug mt-3 mb-2">${item.title}</h3><p class="text-xs text-paper-100/45 mb-4">${item.date} &middot; ${item.location}</p><p class="text-sm text-paper-100/70 leading-relaxed mb-4 max-w-md">${item.description}</p><p class="text-sm font-semibold text-saffron group-hover:underline w-max">Read the full account &rarr;</p></div>`
      : `<img src="${item.image}" alt="${item.title}" class="work-thumb w-full"><div class="p-5 flex flex-col flex-1">${badge(item.category)}<h3 class="font-display text-lg text-white leading-snug mt-2.5 mb-1.5">${item.title}</h3><p class="text-xs text-paper-100/45 mb-3">${item.date} &middot; ${item.location}</p><p class="mt-auto text-sm font-medium text-saffron group-hover:underline w-max">Read more &rarr;</p></div>`;
    card.addEventListener('click', () => openModal(item));
    worksGrid.append(card);
  });
}

function openModal(item) {
  $('#modal-img').src = item.image; $('#modal-img').alt = item.title;
  $('#modal-category').textContent = item.category; $('#modal-title').textContent = item.title;
  $('#modal-meta').textContent = `${item.date} · ${item.location}`;
  $('#modal-description').textContent = item.description;
  modal.classList.remove('hidden'); document.body.style.overflow = 'hidden';
}
function closeModal() { modal.classList.add('hidden'); document.body.style.overflow = ''; }

// Filter buttons and modal controls.
renderWorks();
$('#filters').addEventListener('click', event => {
  const button = event.target.closest('.filter-btn');
  if (!button) return;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('bg-saffron', 'text-white'));
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.add('bg-navy-700', 'text-paper-100/80'));
  button.classList.add('bg-saffron', 'text-white'); button.classList.remove('bg-navy-700', 'text-paper-100/80');
  renderWorks(button.dataset.filter);
});
$('#modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

// Mobile navigation.
const menuButton = $('#menu-btn'), mobileMenu = $('#mobile-menu');
function setMenu(open) {
  mobileMenu.classList.toggle('hidden', !open); $('#menu-icon-open').classList.toggle('hidden', open);
  $('#menu-icon-close').classList.toggle('hidden', !open); menuButton.setAttribute('aria-expanded', String(open));
}
menuButton.addEventListener('click', () => setMenu(mobileMenu.classList.contains('hidden')));
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));

// Grievance form validation and the existing demo submission.
const form = $('#grievance-form'), description = $('#description');
const fields = {
  full_name: [$('#full-name'), value => value.trim().length >= 2],
  phone: [$('#phone'), value => /^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))],
  location: [$('#location'), value => value.trim().length >= 2],
  category: [$('#category'), value => Boolean(value.trim())],
  description: [description, value => value.trim().length >= 20]
};
function showError(input, visible) {
  input.closest('div').querySelector('.field-error')?.classList.toggle('hidden', !visible);
  input.classList.toggle('border-rust', visible); input.classList.toggle('border-line', !visible);
}
function validateForm() {
  let validForm = true;
  Object.values(fields).forEach(([input, test]) => {
    const valid = test(input.value); showError(input, !valid);
    if (!valid) validForm = false;
  });
  return validForm;
}
Object.values(fields).forEach(([input, test]) => ['input', 'change'].forEach(type => input.addEventListener(type, () => {
  if (test(input.value)) showError(input, false);
})));
description.addEventListener('input', () => {
  if (description.value.length > 1000) description.value = description.value.slice(0, 1000);
  $('#char-count').textContent = `${description.value.length} / 1000`;
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!validateForm()) return Object.values(fields).find(([input, test]) => !test(input.value))[0].focus();
  const submit = $('#submit-btn'), label = $('#submit-label'), spinner = $('#submit-spinner');
  submit.disabled = true; label.textContent = 'Submitting…'; spinner.classList.remove('hidden');
  try {
    // Replace this delay with a Formspree or EmailJS request when a real backend is ready.
    await new Promise(resolve => setTimeout(resolve, 900));
    console.log('Grievance submitted:', Object.fromEntries(new FormData(form).entries()));
    $('#ref-number').textContent = `GRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    form.classList.add('hidden'); $('#success-state').classList.remove('hidden');
    $('#success-state').setAttribute('tabindex', '-1'); $('#success-state').focus();
  } catch (error) {
    alert('Something went wrong submitting your complaint. Please try again or call the office directly.'); console.error(error);
  } finally { submit.disabled = false; label.textContent = 'Submit Complaint'; spinner.classList.add('hidden'); }
});
$('#reset-form-btn').addEventListener('click', () => {
  form.reset(); $('#char-count').textContent = '0 / 1000';
  Object.values(fields).forEach(([input]) => showError(input, false));
  $('#success-state').classList.add('hidden'); form.classList.remove('hidden');
});

// Current year in the footer.
$('#year').textContent = new Date().getFullYear();
