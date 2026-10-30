const form = document.getElementById('conversionForm');
const videoInput = document.getElementById('video');
const spinner = document.getElementById('spinner');
const submitBtn = document.getElementById('submitBtn');
const messageArea = document.getElementById('messageArea');

// ---------- UI helpers ----------
function showSpinner() {
  spinner.style.display = 'inline-block';
  submitBtn.disabled = true;
}

function hideSpinner() {
  spinner.style.display = 'none';
  submitBtn.disabled = false;
}

function displayMessage(message, type) {
  messageArea.textContent = message;
  messageArea.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
  messageArea.style.display = 'block';
}

function clearMessage() {
  messageArea.textContent = '';
  messageArea.style.display = 'none';
}

// Read the file name the server sent in the Content-Disposition header
function getFilename(response, fallback) {
  const header = response.headers.get('Content-Disposition') || '';
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) return decodeURIComponent(utf8[1]);
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : fallback;
}

// ---------- Submit ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  if (!videoInput.files.length) {
    displayMessage('Please choose an MP4 file to convert.', 'error');
    return;
  }

  showSpinner();

  try {
    const response = await fetch('/convert', {
      method: 'POST',
      body: new FormData(form),
    });

    if (!response.ok) {
      throw new Error((await response.text()) || 'Something went wrong.');
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = getFilename(response, 'download.mp3');
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);

    displayMessage('Done! Your MP3 download should start automatically.', 'success');
  } catch (err) {
    displayMessage(err.message, 'error');
  } finally {
    hideSpinner(); // always runs, even if the request fails
  }
});
