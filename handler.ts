// ClawHub Local Skill - runs entirely in your agent, no API key required
// Phone Validator - Validate, normalize, and classify phone numbers globally

const CC: Record<string, { name: string; lengths: number[] }> = {
  '1': { name: 'US/Canada', lengths: [10] }, '44': { name: 'United Kingdom', lengths: [10, 11] },
  '86': { name: 'China', lengths: [11] }, '81': { name: 'Japan', lengths: [10, 11] },
  '49': { name: 'Germany', lengths: [10, 11, 12] }, '33': { name: 'France', lengths: [9] },
  '61': { name: 'Australia', lengths: [9] }, '91': { name: 'India', lengths: [10] },
  '55': { name: 'Brazil', lengths: [10, 11] }, '82': { name: 'South Korea', lengths: [9, 10] },
  '39': { name: 'Italy', lengths: [9, 10] }, '34': { name: 'Spain', lengths: [9] },
  '7': { name: 'Russia', lengths: [10] }, '52': { name: 'Mexico', lengths: [10] },
  '65': { name: 'Singapore', lengths: [8] }, '852': { name: 'Hong Kong', lengths: [8] },
  '886': { name: 'Taiwan', lengths: [9, 10] }, '971': { name: 'UAE', lengths: [9] },
};

function validatePhone(phone: string) {
  const original = phone;
  let digits = phone.replace(/[^\d+]/g, '');
  const hasPlus = digits.startsWith('+');
  digits = digits.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return { valid: false, original, normalized: '', country_code: null, country: null, national_number: digits, type: 'unknown', risk_score: 90 };
  let countryCode: string | null = null, countryName: string | null = null, nationalNumber = digits;
  if (hasPlus || digits.length > 10) {
    for (const len of [3, 2, 1]) { const p = digits.substring(0, len); if (CC[p]) { countryCode = p; countryName = CC[p].name; nationalNumber = digits.substring(len); break; } }
  }
  if (!countryCode && digits.length === 10) { countryCode = '1'; countryName = 'US/Canada'; nationalNumber = digits; }
  let validLength = true;
  if (countryCode && CC[countryCode]) validLength = CC[countryCode].lengths.includes(nationalNumber.length);
  let type = 'unknown';
  if (countryCode === '1' && nationalNumber.length === 10) {
    const ac = nationalNumber.substring(0, 3);
    if (['800','888','877','866','855','844','833'].includes(ac)) type = 'toll_free';
    else if (ac === '900') type = 'premium';
    else type = 'mobile_or_landline';
  } else type = 'mobile_or_landline';
  const normalized = countryCode ? `+${countryCode}${nationalNumber}` : `+${digits}`;
  const valid = validLength && nationalNumber.length >= 7;
  return { valid, original, normalized: valid ? normalized : '', country_code: countryCode, country: countryName, national_number: nationalNumber, type, risk_score: valid ? (type === 'premium' ? 60 : 10) : 80 };
}

export async function run(input: { phone: string }) {
  if (!input.phone || typeof input.phone !== 'string' || input.phone.length < 5) throw new Error('phone is required (min 5 chars)');
  const startTime = Date.now();
  const result = validatePhone(input.phone);
  return { ...result, _meta: { skill: 'phone-validator', latency_ms: Date.now() - startTime } };
}
export default run;
