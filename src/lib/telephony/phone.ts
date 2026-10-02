export function normalizePhoneForDial(rawPhone: string, defaultCountryCode = "+33") {
  const compact = rawPhone.trim().replace(/[\s().-]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;

  if (/^00[1-9]\d{7,14}$/.test(compact)) {
    return `+${compact.slice(2)}`;
  }

  const countryCode = defaultCountryCode.trim();
  if (/^0\d{9}$/.test(compact) && /^\+[1-9]\d{0,3}$/.test(countryCode)) {
    return `${countryCode}${compact.slice(1)}`;
  }

  return null;
}
