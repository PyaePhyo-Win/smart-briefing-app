const padTwo = (value: number) => String(value).padStart(2, "0");

const toValidDate = (value: Date | string | number) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatLocalDateTime = (value: Date | string | number) => {
  const date = toValidDate(value);
  if (!date) return "--";

  const year = date.getFullYear();
  const month = padTwo(date.getMonth() + 1);
  const day = padTwo(date.getDate());
  const hours = date.getHours();
  const displayHour = padTwo(hours % 12 || 12);
  const minutes = padTwo(date.getMinutes());
  const seconds = padTwo(date.getSeconds());
  const period = hours >= 12 ? "PM" : "AM";

  return `${year}-${month}-${day} ${displayHour}:${minutes}:${seconds} ${period}`;
};
