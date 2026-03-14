// Search page UX controller with friendly validation and transitions.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('cityName');
  const helpText = document.getElementById('searchHelp');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const city = input.value.trim();

    if (!city) {
      helpText.textContent = 'Please enter a city name before exploring.';
      helpText.classList.add('is-error');
      input.focus();
      return;
    }

    helpText.textContent = `Preparing insights for ${city}...`;
    helpText.classList.remove('is-error');

    // Navigate to the destination insights page with encoded city query.
    window.location.href = `weather.html?city=${encodeURIComponent(city)}`;
  });
});
