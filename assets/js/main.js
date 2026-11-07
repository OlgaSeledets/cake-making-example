"use strict";
const cakes = [
    { title: 'Ягодная классика', description: 'Воздушный крем, свежие ягоды и лёгкий декор. Для тех, кто любит простоту и сезонные вкусы.', image: 'assets/img/cake-berries.webp', alt: 'Светлый торт со свежими ягодами' },
    { title: 'Шоколадное настроение', description: 'Глубокий шоколадный характер, насыщенный вкус и выразительные текстуры.', image: 'assets/img/cake-chocolate.webp', alt: 'Шоколадный торт с конфетами и шоколадным кремом' },
    { title: 'Нежный праздник', description: 'Пастельные оттенки, деликатные детали и настроение самого тёплого торжества.', image: 'assets/img/cake-celebration.webp', alt: 'Розовый торт с цветочным декором' },
    { title: 'Ботаника', description: 'Лаконичное оформление, живые природные мотивы и красота без лишних деталей.', image: 'assets/img/cake-botanical.webp', alt: 'Белый торт с веточками зелени' }
];
function query(selector) { const element = document.querySelector(selector); if (!element)
    throw new Error(`Element not found: ${selector}`); return element; }
const toggle = query('#menuToggle');
const mobileNav = query('#mobileNav');
function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Открыть меню'); mobileNav.classList.remove('is-open'); mobileNav.inert = true; }
toggle.addEventListener('click', () => { const isOpen = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(isOpen)); toggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню'); mobileNav.classList.toggle('is-open', isOpen); mobileNav.inert = !isOpen; });
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
} });
document.addEventListener('click', event => { if (!query('#header').contains(event.target))
    closeMenu(); });
const track = query('#cakesTrack');
const prev = query('#sliderPrev');
const next = query('#sliderNext');
const pagination = query('#sliderPagination');
const cards = Array.from(track.querySelectorAll('.cake-card'));
let activeIndex = 0;
function goTo(index) { const target = Math.max(0, Math.min(cards.length - 1, index)); cards[target]?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest', inline: 'start' }); }
for (let i = 0; i < cards.length; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slider-dot';
    dot.setAttribute('aria-label', `Перейти к торту ${i + 1}: ${cakes[i].title}`);
    dot.addEventListener('click', () => goTo(i));
    pagination.append(dot);
}
const dots = Array.from(pagination.querySelectorAll('button'));
function updateSlider() { let closest = 0; let distance = Infinity; cards.forEach((card, index) => { const diff = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft); if (diff < distance) {
    distance = diff;
    closest = index;
} }); activeIndex = closest; dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === activeIndex))); prev.disabled = track.scrollLeft < 5; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5; }
prev.addEventListener('click', () => goTo(activeIndex - 1));
next.addEventListener('click', () => goTo(activeIndex + 1));
track.addEventListener('scroll', updateSlider, { passive: true });
window.addEventListener('resize', updateSlider);
track.addEventListener('keydown', event => { if (event.target !== track)
    return; if (event.key === 'ArrowRight') {
    event.preventDefault();
    goTo(activeIndex + 1);
} if (event.key === 'ArrowLeft') {
    event.preventDefault();
    goTo(activeIndex - 1);
} });
requestAnimationFrame(updateSlider);
const dialog = query('#cakeDialog');
const dialogClose = query('#dialogClose');
const dialogImage = query('#dialogImage');
const dialogTitle = query('#dialogTitle');
const dialogDescription = query('#dialogDescription');
const dialogContact = query('#dialogContact');
let lastTrigger = null;
function openCake(index, trigger) { const cake = cakes[index]; if (!cake)
    return; lastTrigger = trigger; dialogImage.src = cake.image; dialogImage.alt = cake.alt; dialogTitle.textContent = cake.title; dialogDescription.textContent = cake.description; dialog.showModal(); dialogClose.focus(); }
track.querySelectorAll('[data-cake]').forEach(button => button.addEventListener('click', () => openCake(Number(button.dataset.cake), button)));
function closeDialog() { dialog.close(); }
dialogClose.addEventListener('click', closeDialog);
dialog.addEventListener('click', event => { if (event.target === dialog)
    closeDialog(); });
dialog.addEventListener('close', () => lastTrigger?.focus());
dialogContact.addEventListener('click', closeDialog);
const toast = query('#demoToast');
let toastTimeout;
document.querySelectorAll('[data-demo-contact]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); const platform = link.dataset.demoContact ?? 'мессенджере'; toast.textContent = `Это демонстрационный сайт. Перед публикацией замените ссылку на свой ${platform} в index.html.`; toast.classList.add('show'); window.clearTimeout(toastTimeout); toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 5200); }));
const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
    } }); }, { threshold: .08 });
    revealElements.forEach(element => observer.observe(element));
}
else {
    revealElements.forEach(element => element.classList.add('visible'));
}
