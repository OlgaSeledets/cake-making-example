import { cakes, calculatePrice, money, sizeLabel, minOrderDate, type CakeId } from './pricing';
const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};
const all = <T extends HTMLElement = HTMLElement>(selector: string): T[] => Array.from(document.querySelectorAll<T>(selector));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menu = $<HTMLButtonElement>('.menu-toggle');
const nav = $('#main-nav');
function toggleMenu(open: boolean): void {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav.classList.toggle('is-open', open);
}
menu.addEventListener('click', () => toggleMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', event => { if ((event.target as Element).closest('a')) toggleMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { toggleMenu(false); menu.focus(); }
});
document.addEventListener('click', event => { if (!(event.target as Element).closest('.header')) toggleMenu(false); });
window.matchMedia('(min-width: 641px)').addEventListener('change', event => { if (event.matches) toggleMenu(false); });

all<HTMLButtonElement>('[data-filter]').forEach(button => button.addEventListener('click', () => {
  all<HTMLButtonElement>('[data-filter]').forEach(item => {
    const active = item === button; item.setAttribute('aria-pressed', String(active)); item.classList.toggle('active', active);
  });
  let visible = 0;
  all<HTMLElement>('.cake-card').forEach(card => {
    const show = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter;
    card.hidden = !show; card.classList.remove('filter-enter');
    if (show) { visible++; if (!reducedMotion.matches) card.classList.add('filter-enter'); }
  });
  $('#catalog-status').textContent = `Показано десертов: ${visible}`;
}));

const dialogs = all<HTMLDialogElement>('dialog');
const returnFocus = new WeakMap<HTMLDialogElement, HTMLElement>();
function openDialog(dialog: HTMLDialogElement): void {
  returnFocus.set(dialog, document.activeElement as HTMLElement);
  dialog.showModal(); document.body.classList.add('modal-open');
  dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();
}
dialogs.forEach(dialog => {
  dialog.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  let beganOnBackdrop = false;
  const outside = (event: PointerEvent | MouseEvent): boolean => { const rect = dialog.getBoundingClientRect(); return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; };
  dialog.addEventListener('pointerdown', event => { beganOnBackdrop = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => { if (beganOnBackdrop && event.target === dialog && outside(event)) dialog.close(); beganOnBackdrop = false; });
  dialog.addEventListener('close', () => {
    if (!dialogs.some(item => item.open)) document.body.classList.remove('modal-open');
    const previous = returnFocus.get(dialog); if (previous?.isConnected) previous.focus({ preventScroll: true });
  });
});
let currentCake: CakeId = 'chocolate';
const cakeDialog = $<HTMLDialogElement>('#cake-dialog');
all<HTMLButtonElement>('[data-cake]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.cake as CakeId; const cake = cakes[id]; currentCake = id;
  $('#cake-modal-title').textContent = cake.name;
  const image = $<HTMLImageElement>('#cake-modal-image'); image.src = `./assets/${cake.image}`; image.alt = cake.alt;
  $('#cake-modal-description').textContent = cake.description;
  $('#cake-modal-size').textContent = `От ${sizeLabel(id, cake.min)}`;
  $('#cake-modal-price').textContent = `От ${money(calculatePrice(id, cake.min, 0))}`;
  $('#choose-cake').firstChild!.textContent = id === 'cupcakes' ? 'Выбрать капкейки ' : 'Хочу такой торт ';
  openDialog(cakeDialog);
}));

const flavors = [
  { title: 'Сливочный. Ягодный. Нежный.', description: 'Сливочный сыр, тонкая песочная основа и черничный соус с целыми ягодами. Умеренная сладость и лёгкая кислинка.', image: 'cheesecake.jpg', alt: 'Сливочный чизкейк с черникой на песочной основе' },
  { title: 'Шоколад в главной роли.', description: 'Влажный бисквит с какао, крем на молочном шоколаде и тонкий слой ганаша. Для тех, кто всегда выбирает шоколадный.', image: 'chocolate.jpg', alt: 'Шоколадный торт, украшенный ганашем и кремом' },
  { title: 'Та самая ваниль с ягодами.', description: 'Мягкий ванильный бисквит, сливочный крем и ягодная серединка. Классическое сочетание для капкейков и праздничного торта.', image: 'pink.jpg', alt: 'Ванильные капкейки с ягодами и розовым сливочным кремом' },
];
const tabs = all<HTMLButtonElement>('[data-flavor]');
let activeFlavor = 0;
function setFlavor(index: number, focus = false): void {
  activeFlavor = (index + flavors.length) % flavors.length;
  const flavor = flavors[activeFlavor];
  tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === activeFlavor)); tab.tabIndex = i === activeFlavor ? 0 : -1; });
  $('#flavor-panel').setAttribute('aria-labelledby', tabs[activeFlavor].id);
  $('#flavor-title').textContent = flavor.title; $('#flavor-description').textContent = flavor.description;
  const image = $<HTMLImageElement>('#filling-image'); image.src = `./assets/${flavor.image}`; image.alt = flavor.alt;
  $('#flavor-count').innerHTML = `0${activeFlavor + 1} <span>/ 03</span>`;
  if (focus) tabs[activeFlavor].focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => setFlavor(index));
  tab.addEventListener('keydown', event => {
    const keys: Record<string, number> = { ArrowRight: activeFlavor + 1, ArrowLeft: activeFlavor - 1, Home: 0, End: flavors.length - 1 };
    if (event.key in keys) { event.preventDefault(); setFlavor(keys[event.key], true); }
  });
});
$('#flavor-prev').addEventListener('click', () => setFlavor(activeFlavor - 1, true));
$('#flavor-next').addEventListener('click', () => setFlavor(activeFlavor + 1, true));

const type = $<HTMLSelectElement>('#cake-type');
const weight = $<HTMLInputElement>('#cake-weight');
const date = $<HTMLInputElement>('#event-date');
const form = $<HTMLFormElement>('#order-form');
const comment = $<HTMLTextAreaElement>('#order-comment');
function selectedId(): CakeId { return type.value as CakeId; }
function selectedDecor(): number { return Number($<HTMLInputElement>('input[name="decor"]:checked').value); }
function refreshPrice(): void {
  const id = selectedId(); const amount = Number(weight.value);
  $<HTMLOutputElement>('#weight-value').value = sizeLabel(id, amount);
  weight.setAttribute('aria-valuetext', sizeLabel(id, amount));
  $<HTMLOutputElement>('#price').value = money(calculatePrice(id, amount, selectedDecor()));
}
function resetSize(): void {
  const cake = cakes[selectedId()];
  weight.min = String(cake.min); weight.max = String(cake.max); weight.step = String(cake.step); weight.value = String(cake.min);
  $('#weight-label').textContent = selectedId() === 'cupcakes' ? 'Количество капкейков' : 'Вес торта';
  $('#range-min').textContent = `${cake.min} ${cake.unit}`; $('#range-max').textContent = `${cake.max} ${cake.unit}`;
  refreshPrice();
}
type.addEventListener('change', resetSize);
weight.addEventListener('input', refreshPrice);
all<HTMLInputElement>('input[name="decor"]').forEach(input => input.addEventListener('change', refreshPrice));
date.min = minOrderDate();
date.addEventListener('focus', () => { date.min = minOrderDate(); });
date.addEventListener('input', () => date.setCustomValidity(''));
$('#choose-cake').addEventListener('click', () => {
  type.value = currentCake; resetSize(); cakeDialog.close();
  // Wait for the dialog's close event to restore the original focus first.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('#order').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    date.focus({ preventScroll: true });
  }));
});
let orderText = '';
form.addEventListener('submit', event => {
  event.preventDefault(); date.min = minOrderDate(); date.setCustomValidity('');
  if (date.value && date.value < date.min) date.setCustomValidity('Выберите дату минимум через 3 дня.');
  if (!form.reportValidity()) return;
  const id = selectedId(); const amount = Number(weight.value); const decor = selectedDecor();
  const formattedDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date.value}T12:00:00`));
  const rows = [ ['Десерт', cakes[id].name], ['Дата праздника', formattedDate], ['Размер', sizeLabel(id, amount)], ['Оформление', decor ? 'Особенная надпись (+800 ₽)' : 'Как в каталоге'], ['Примерная стоимость', money(calculatePrice(id, amount, decor))] ];
  const details = $('#summary-details'); details.replaceChildren();
  rows.forEach(([label, value]) => {
    const row = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value; row.append(dt, dd); details.append(row);
  });
  $('#summary-comment').textContent = comment.value.trim() ? `Ваша идея: ${comment.value.trim()}` : '';
  $('#summary-comment').hidden = !comment.value.trim();
  $('#download-status').textContent = '';
  orderText = `КРОШКА — предварительный расчёт\n\n${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}${comment.value.trim() ? `\nВаша идея: ${comment.value.trim()}` : ''}\n\nЗаказ не отправлен. Демонстрационный проект.\nСтоимость ориентировочная, без доставки. Сложный декор согласуется отдельно.\nСостав содержит молоко, яйца, пшеницу; возможны следы орехов.\n`;
  openDialog($<HTMLDialogElement>('#summary-dialog'));
});
$('#download-order').addEventListener('click', () => {
  const blob = new Blob(['\uFEFF', orderText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = 'kroshka-my-cake.txt'; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#download-status').textContent = 'Файл с расчётом подготовлен к скачиванию.';
});
$('#demo-info').addEventListener('click', () => openDialog($<HTMLDialogElement>('#info-dialog')));
$('#year').textContent = String(new Date().getFullYear());
refreshPrice();
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('reveal-visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  all('.section-head, .about-intro, .steps li, .order-intro').forEach(element => observer.observe(element));
}
