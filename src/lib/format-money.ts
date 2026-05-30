// Форматирование денежных сумм для UI. Все суммы — целые рубли (на PoC копейки
// не используются; в БД amount тип numeric, но в продукте мы пишем без копеек).
//
// Подпись «±» добавляется в зависимости от знака — для разбивки баланса и
// карточек операций. Без знака — `formatMoney`.

const RUB = ' ₽'; // неразрывный пробел перед знаком валюты.
// `−` — типографский минус (длиннее ASCII `-`), `+` оставляем как есть.
const MINUS = '−';

// Группировка по три цифры с неразрывными пробелами.
function groupThousands(n: number): string {
  return Math.round(Math.abs(n)).toLocaleString('ru-RU').replace(/\s/g, ' ');
}

export function formatMoney(amount: number): string {
  return `${groupThousands(amount)}${RUB}`;
}

// «+4 000 ₽» / «−80 000 ₽» / «0 ₽».
export function formatSignedMoney(amount: number): string {
  if (amount === 0) return `0${RUB}`;
  const sign = amount > 0 ? '+' : MINUS;
  return `${sign}${groupThousands(amount)}${RUB}`;
}
