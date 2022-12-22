export async function pause(ms) {
  await new Promise((resolve) => { setTimeout(() => { resolve(); }, ms)});
}
export function getDateTimeSignature(date) {
  return date.getFullYear() + '-' +
    pad2(date.getMonth() + 1) + '-' +
    pad2(date.getDate()) + '-' +
    pad2(date.getHours()) + '-' +
    pad2(date.getMinutes()) + '-' +
    pad2(date.getSeconds());
}

function pad2(n) {  // always returns a string
  return (n < 10 ? '0' : '') + n;
}

export function getRevDateText(date) {
  let text = '';
  const now = new Date();
  const dateDiff = now.valueOf() - date.valueOf();
  if (dateDiff > 1000 * 60 * 60 * 24) {
    text = Math.floor(dateDiff  / (1000 * 60 * 60 * 24)) + ' дней назад';
  } else if (dateDiff > 1000 * 60 * 60) {
    text = Math.floor(dateDiff  / (1000 * 60 * 60)) + ' часов назад';
  } else if (dateDiff > 1000 * 60) {
    text = Math.floor(dateDiff  / (1000 * 60)) + ' минут назад';
  } else {
    text = Math.floor(dateDiff / (1000)) + ' секунд назад';
  }
  return text;
}