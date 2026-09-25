export type Currency = { code: string; name: string; symbol?: string };

const fallback = ['AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD','HKD','HNL','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SOS','SRD','SSP','STN','SVC','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS','VED','VES','VND','VUV','WST','XAF','XCD','XOF','XPF','YER','ZAR','ZMW','ZWL'];

function displayName(code: string) {
  try { return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || code; } catch { return code; }
}
function symbol(code: string) {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(part => part.type === 'currency')?.value; } catch { return undefined; }
}

/** ISO 4217 currencies supported by the visitor's Intl implementation, with a stable fallback. */
export const currencies: Currency[] = Array.from(new Set(typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('currency') : fallback))
  .sort()
  .map(code => ({ code, name: displayName(code), symbol: symbol(code) }));

export const isSupportedCurrency = (code: string) => currencies.some(currency => currency.code === code);
export const formatCurrency = (value: number, currency: string, locale?: string) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
