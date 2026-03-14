// Result page controller for live exchange display.
document.addEventListener('DOMContentLoaded', async () => {
  const outputEl = document.getElementById('resultOutput');
  const params = new URLSearchParams(window.location.search);

  const from = params.get('from');
  const to = params.get('to');
  const amount = params.get('amount');

  if (!from || !to || !amount) {
    outputEl.innerHTML = '<p class="is-error">Missing query parameters. Please retry your conversion.</p>';
    return;
  }

  try {
    const query = new URLSearchParams({ from, to, amount });
    const response = await fetch(`/api/exchange?${query.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || 'Could not fetch exchange rate.');
    }

    outputEl.innerHTML = `
      <div class="conversion-highlight">${data.amount} ${data.from} = <strong>${data.converted} ${data.to}</strong></div>
      <p>Rate: 1 ${data.from} = ${data.rate} ${data.to}</p>
      <p>Updated: ${data.date}</p>
      <p class="muted">Provider: ${data.provider}</p>
    `;
  } catch (error) {
    outputEl.innerHTML = `<p class="is-error">${error.message}</p>`;
    console.error('Exchange conversion failed:', error);
  }
});
