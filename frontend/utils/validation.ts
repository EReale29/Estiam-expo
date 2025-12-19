const CITY_COUNTRY_REGEX = /^[A-Za-zÀ-ÿ' -]+, [A-Za-zÀ-ÿ' -]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string) => EMAIL_REGEX.test(email.trim());

export const isValidPassword = (password: string) => password.trim().length >= 8;

export const isValidName = (name: string) => name.trim().length > 1;

export const isValidDestination = (value: string) => CITY_COUNTRY_REGEX.test(value.trim());

export const isEndDateAfterStart = (start: Date | null, end: Date | null) => {
  if (!start || !end) return true;
  return end.getTime() >= start.getTime();
};
