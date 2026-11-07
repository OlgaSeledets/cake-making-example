interface Cake {
  title: string;
  description: string;
  image: string;
  alt: string;
}

const cakes: Cake[] = [
  { title: 'Классические', description: 'Нежные кремовые торты со свежими ягодами. Лаконичное оформление для дней рождения и уютных семейных праздников.', image: 'assets/img/cake-berries.webp', alt: 'Кремовый торт с ягодами на подставке' },
  { title: 'Шоколадные', description: 'Шоколадный бисквит, насыщенный крем и выразительный декор. Для тех, кто всегда выбирает шоколад.', image: 'assets/img/cake-chocolate.webp', alt: 'Шоколадный торт с трюфелями' },
  { title: 'Праздничные', description: 'Нежные цвета, цветочный декор и продуманные детали. Для свадеб, юбилеев и особенных событий.', image: 'assets/img/cake-celebration.webp', alt: 'Розовый торт с кремовыми цветами' },
  { title: 'Индивидуальный дизайн', description: 'Минималистичные композиции с живыми природными мотивами. Вдохновение для торта по вашей идее.', image: 'assets/img/cake-botanical.webp', alt: 'Светлый торт с веточками эвкалипта' },
  { title: 'Ягодные', description: 'Сезонные ягоды, лёгкие текстуры и яркие детали. Когда хочется добавить празднику свежих красок.', image: 'assets/img/cake-seasonal.webp', alt: 'Торт с шоколадными подтёками и ягодами' }
];

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Не найден элемент: ${selector}`);
  return element;
}

const menuToggle = query<HTMLButtonElement>('#menuToggle');
const mobileNav = query<HTMLElement>('#mobileNav');
const header = query<HTMLElement>('.site-header');

function closeMenu(): void {
  if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
  mobileNav.inert = true;
  mobileNav.classList.remove('is-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.inert = !open;
  mobileNav.classList.toggle('is-open', open);
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('click', (event) => {
  if (!header.contains(event.target as Node)) closeMenu();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 850) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});

const track = query<HTMLElement>('#cakesTrack');
const cards = Array.from(track.querySelectorAll<HTMLElement>('.cake-card'));
const prev = query<HTMLButtonElement>('#sliderPrev');
const next = query<HTMLButtonElement>('#sliderNext');
const pagination = query<HTMLElement>('#sliderPagination');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeIndex = 0;

function goTo(index: number): void {
  const i = Math.max(0, Math.min(cards.length - 1, index));
  const left = cards[i].offsetLeft - track.offsetLeft;
  track.scrollTo({ left, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  activeIndex = i;
  updateSlider();
}

cards.forEach((card, i) => {
  card.setAttribute('aria-label', `${i + 1} из ${cards.length}: ${cakes[i].title}`);
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'slider-dot';
  dot.setAttribute('aria-label', `Показать: ${cakes[i].title}`);
  dot.addEventListener('click', () => goTo(i));
  pagination.append(dot);
});

const dots = Array.from(pagination.querySelectorAll<HTMLButtonElement>('.slider-dot'));
function updateSlider(): void {
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const current = track.scrollLeft;
  let closest = 0;
  let minDistance = Infinity;
  cards.forEach((card, i) => {
    const target = Math.min(maxScroll, Math.max(0, card.offsetLeft - track.offsetLeft));
    const distance = Math.abs(target - current);
    if (distance < minDistance) { closest = i; minDistance = distance; }
  });
  activeIndex = closest;
  prev.disabled = current <= 2;
  next.disabled = current >= maxScroll - 2;
  dots.forEach((dot, i) => {
    if (i === activeIndex) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
}
prev.addEventListener('click', () => goTo(activeIndex - 1));
next.addEventListener('click', () => goTo(activeIndex + 1));
track.addEventListener('scroll', updateSlider, { passive: true });
window.addEventListener('resize', updateSlider);
track.addEventListener('keydown', (event) => {
  if (event.target !== track) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); goTo(activeIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(activeIndex - 1); }
});
requestAnimationFrame(updateSlider);

const dialog = query<HTMLDialogElement>('#cakeDialog');
const dialogClose = query<HTMLButtonElement>('#dialogClose');
const dialogPrev = query<HTMLButtonElement>('#dialogPrev');
const dialogNext = query<HTMLButtonElement>('#dialogNext');
const dialogImage = query<HTMLImageElement>('#dialogImage');
const dialogTitle = query<HTMLElement>('#dialogTitle');
const dialogDescription = query<HTMLElement>('#dialogDescription');
let selectedCake = 0;
let lastTrigger: HTMLElement | null = null;

function showCake(index: number): void {
  selectedCake = (index + cakes.length) % cakes.length;
  const cake = cakes[selectedCake];
  dialogImage.src = cake.image;
  dialogImage.alt = cake.alt;
  dialogTitle.textContent = cake.title;
  dialogDescription.textContent = cake.description;
}

track.querySelectorAll<HTMLButtonElement>('[data-cake]').forEach((button) => {
  button.addEventListener('click', () => {
    lastTrigger = button;
    showCake(Number(button.dataset.cake));
    dialog.showModal();
    dialogClose.focus();
  });
});
function closeDialog(): void { dialog.close(); }
dialogClose.addEventListener('click', closeDialog);
dialogPrev.addEventListener('click', () => showCake(selectedCake - 1));
dialogNext.addEventListener('click', () => showCake(selectedCake + 1));
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
dialog.addEventListener('close', () => { lastTrigger?.focus(); });
dialog.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLButtonElement && event.target.id === 'dialogClose') return;
  if (event.key === 'ArrowRight') { event.preventDefault(); showCake(selectedCake + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showCake(selectedCake - 1); }
});

const toast = query<HTMLElement>('#demoToast');
let toastTimeout: number | undefined;
document.querySelectorAll<HTMLAnchorElement>('[data-demo-contact]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const platform = link.dataset.demoContact ?? 'мессенджер';
    toast.textContent = `Это демонстрационный сайт. Замените ссылку на свой ${platform} в index.html.`;
    toast.classList.add('show');
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 5000);
  });
});

const revealItems = document.querySelectorAll<HTMLElement>('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  revealItems.forEach((el) => observer.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('visible'));
}
