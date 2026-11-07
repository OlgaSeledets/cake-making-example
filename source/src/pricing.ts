export type CakeId = 'berry' | 'chocolate' | 'cheesecake' | 'cupcakes';
export interface Cake { name: string; image: string; alt: string; description: string; price: number; min: number; max: number; step: number; unit: 'кг' | 'шт.'; }
export const cakes: Record<CakeId, Cake> = {
  berry: { name: 'Ягодное настроение', image: 'hero.jpg', alt: 'Ярусный торт с белым кремом и свежими ягодами', description: 'Ванильный бисквит, сливочный крем и ягодная прослойка. Снаружи — светлый крем и сезонные ягоды. Число ярусов зависит от веса; при минимальном весе 3 кг торт будет ниже, чем на фото.', price: 3200, min: 3, max: 8, step: 0.5, unit: 'кг' },
  chocolate: { name: 'Шоколадный, пожалуйста', image: 'chocolate.jpg', alt: 'Шоколадный торт с ганашем и кремовыми розетками', description: 'Шоколадный бисквит, крем на молочном шоколаде и тонкий слой ганаша. Насыщенный вкус какао, мягкая текстура и классический декор кремом.', price: 2800, min: 2, max: 6, step: 0.5, unit: 'кг' },
  cheesecake: { name: 'Черничный выходной', image: 'cheesecake.jpg', alt: 'Кусочек сливочного чизкейка с черничным соусом', description: 'Запечённый чизкейк на песочной основе со сливочным сыром и черничным соусом. Продаётся целым: на фото — порционный кусочек, чтобы показать начинку.', price: 3200, min: 1, max: 3, step: 0.5, unit: 'кг' },
  cupcakes: { name: 'Маленькие радости', image: 'pink.jpg', alt: 'Капкейки с розовым кремом и клубникой', description: 'Ванильные капкейки с ягодной серединкой и шапочкой сливочного крема. Собираем в коробки по 6 штук. Цвет крема можно подобрать к празднику.', price: 350, min: 6, max: 30, step: 6, unit: 'шт.' },
};
export const money = (amount: number): string => `${new Intl.NumberFormat('ru-RU').format(amount)} ₽`;
export function calculatePrice(id: CakeId, amount: number, decor: number): number {
  const cake = cakes[id];
  if (!Number.isFinite(amount) || amount < cake.min || amount > cake.max || Math.abs((amount - cake.min) / cake.step - Math.round((amount - cake.min) / cake.step)) > 1e-8) throw new RangeError('Недопустимый размер заказа');
  if (decor !== 0 && decor !== 800) throw new RangeError('Недопустимая стоимость декора');
  return Math.round(cake.price * amount + decor);
}
export function sizeLabel(id: CakeId, amount: number): string {
  return id === 'cupcakes' ? `${amount} шт. · ${amount / 6} ${amount === 6 ? 'набор' : amount < 30 ? 'набора' : 'наборов'}` : `${String(amount).replace('.', ',')} кг · ~${Math.round(amount * 5)} порций`;
}
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function minOrderDate(today = new Date()): string {
  const date = new Date(today); date.setDate(date.getDate() + 3); return localDate(date);
}
