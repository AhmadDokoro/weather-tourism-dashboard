// Currency map for user-friendly dropdown labels.
const currencyMap = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah',
  SGD: 'Singapore Dollar',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  PHP: 'Philippine Peso',
  THB: 'Thai Baht',
  KRW: 'South Korean Won',
  NZD: 'New Zealand Dollar',
  CHF: 'Swiss Franc',
  HKD: 'Hong Kong Dollar',
  ZAR: 'South African Rand',
  BRL: 'Brazilian Real',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  PLN: 'Polish Zloty',
  MXN: 'Mexican Peso',
  RUB: 'Russian Ruble',
  AED: 'Emirati Dirham',
  BHD: 'Bahraini Dinar',
  VND: 'Vietnamese Dong',
  TRY: 'Turkish Lira',
  ARS: 'Argentine Peso',
  NGN: 'Nigerian Naira',
  EGP: 'Egyptian Pound',
  PKR: 'Pakistani Rupee',
  LKR: 'Sri Lankan Rupee'
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('exchangeForm');
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');

  // Populate currency dropdowns once.
  Object.keys(currencyMap).forEach((code) => {
    const label = `${code} — ${currencyMap[code]}`;
    fromSelect.appendChild(new Option(label, code));
    toSelect.appendChild(new Option(label, code));
  });

  // Sensible defaults for common travel conversions.
  fromSelect.value = 'USD';
  toSelect.value = 'EUR';

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const amount = Number(document.getElementById('amount').value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (Number.isNaN(amount) || amount <= 0 || !from || !to) {
      return;
    }

    const query = new URLSearchParams({
      amount: String(amount),
      from,
      to
    });

    window.location.href = `result.html?${query.toString()}`;
  });
});
