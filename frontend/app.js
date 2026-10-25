// Main Generator Form & Export Logic for Gift4Event (index.html)

let extractedBitLink1 = null;
let extractedBitLink2 = null;

function setupQRReader(uploadId, successId, errorId, setLinkCallback) {
    const uploadEl = document.getElementById(uploadId);
    if (!uploadEl) return;

    uploadEl.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const successMsg = document.getElementById(successId);
        const errorMsg = document.getElementById(errorId);

        successMsg.classList.add('hidden');
        errorMsg.classList.add('hidden');

        setLinkCallback(null);

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "attemptBoth",
                });

                if (code && code.data) {
                    setLinkCallback(code.data);
                    successMsg.classList.remove('hidden');
                } else {
                    errorMsg.classList.remove('hidden');
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Toggle Generator Form Fields
function toggleGeneratorForm() {
    const wrapper = document.getElementById('form-fields-wrapper');
    const chevron = document.getElementById('form-toggle-chevron');
    if (!wrapper || !chevron) return;

    const isHidden = wrapper.classList.contains('hidden');

    if (isHidden) {
        wrapper.classList.remove('hidden');
        chevron.classList.add('rotate-180');
        setTimeout(() => {
            document.getElementById('toggle-form-btn').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else {
        wrapper.classList.add('hidden');
        chevron.classList.remove('rotate-180');
    }
}

function showCopiedFeedback(el) {
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.add('hidden');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    setupQRReader('bit-qr-upload-1', 'qr-success-msg-1', 'qr-error-msg-1', (val) => extractedBitLink1 = val);
    setupQRReader('bit-qr-upload-2', 'qr-success-msg-2', 'qr-error-msg-2', (val) => extractedBitLink2 = val);

    const termsCheckbox = document.getElementById('terms-consent');
    const termsError = document.getElementById('terms-consent-error');
    const termsWrapper = document.getElementById('terms-consent-wrapper');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            if (termsCheckbox.checked) {
                if (termsError) termsError.classList.add('hidden');
                if (termsWrapper) {
                    termsWrapper.classList.remove('border-red-300', 'bg-red-50/60');
                    termsWrapper.classList.add('border-indigo-100', 'bg-white/80');
                }
            }
        });
    }

    const generatorForm = document.getElementById('generator-form');
    if (generatorForm) {
        generatorForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;

            // Show loading state on button
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>מייצר קישור מאובטח...</span>
            `;
            submitBtn.disabled = true;

            const coupleNames = document.getElementById('coupleNames').value;
            const customSlug = document.getElementById('customSlug').value.trim();
            const wazeLink = document.getElementById('wazeLink') ? document.getElementById('wazeLink').value.trim() : '';
            const name = document.getElementById('name').value;
            const bank = document.getElementById('bank').value;
            const branch = document.getElementById('branch').value;
            const account = document.getElementById('account').value;
            const eventDate = document.getElementById('eventDate').value;

            // Client-side past-date validation
            const eventDateError = document.getElementById('eventDate-error');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const chosenDate = new Date(eventDate);
            if (!eventDate || chosenDate < today) {
                eventDateError.classList.remove('hidden');
                document.getElementById('eventDate').scrollIntoView({ behavior: 'smooth', block: 'center' });
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.disabled = false;
                return;
            } else {
                eventDateError.classList.add('hidden');
            }

            // Client-side Terms & Privacy Clickwrap consent validation
            if (!termsCheckbox || !termsCheckbox.checked) {
                if (termsError) termsError.classList.remove('hidden');
                if (termsWrapper) {
                    termsWrapper.classList.remove('border-indigo-100', 'bg-white/80');
                    termsWrapper.classList.add('border-red-300', 'bg-red-50/60');
                    termsWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.disabled = false;
                return;
            } else {
                if (termsError) termsError.classList.add('hidden');
            }

            const payload = {
                coupleNames: coupleNames,
                customSlug: customSlug,
                wazeLink: wazeLink,
                eventDate: eventDate,
                bankDetails: {
                    beneficiaryName: name,
                    bankName: bank,
                    branchNumber: branch,
                    accountNumber: account
                },
                bitLinks: [],
                payboxLinks: []
            };

            if (extractedBitLink1) payload.bitLinks.push(extractedBitLink1);
            if (extractedBitLink2) payload.bitLinks.push(extractedBitLink2);

            const payboxLink1Value = document.getElementById('paybox-link-1').value.trim();
            if (payboxLink1Value) payload.payboxLinks.push(payboxLink1Value);

            const payboxLink2Value = document.getElementById('paybox-link-2').value.trim();
            if (payboxLink2Value) payload.payboxLinks.push(payboxLink2Value);

            try {
                const response = await fetch('/api/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    if (response.status === 409) {
                        throw new Error('שם הקישור כבר תפוס. אנא בחרו שם אחר.');
                    }
                    throw new Error(errorData.error || 'Failed to create configuration');
                }

                const data = await response.json();

                // Fallback for local testing or edge cases if API doesn't return full URL
                const origin = window.location.origin === 'null' || window.location.origin === 'file://' ? 'https://gift4event.com' : window.location.origin;
                const finalShareableUrl = data.url || `${origin}/${data.slug}`;

                const linkInput = document.getElementById('generated-link');
                linkInput.value = finalShareableUrl;

                const resultBox = document.getElementById('result-container');
                resultBox.classList.remove('hidden');

                const qrContainer = document.getElementById('qrcode');
                qrContainer.innerHTML = '';

                new QRCode(qrContainer, {
                    text: finalShareableUrl,
                    width: 200,
                    height: 200,
                    colorDark: "#1e3a8a",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });

                // Populate printable PDF sign template (defined in frontend/pdf-sign.js)
                if (typeof updatePdfSignData === 'function') {
                    updatePdfSignData(finalShareableUrl, coupleNames);
                }

                setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);

            } catch (error) {
                console.error('Error creating link:', error);
                alert(error.message || 'אירעה שגיאה ביצירת הקישור. אנא נסו שוב.');
            } finally {
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.disabled = false;
            }
        });
    }

    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            const linkInput = document.getElementById('generated-link');
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);

            const feedback = document.getElementById('copy-feedback');

            navigator.clipboard.writeText(linkInput.value).then(() => {
                showCopiedFeedback(feedback);
            }).catch(() => {
                document.execCommand('copy');
                showCopiedFeedback(feedback);
            });
        });
    }

    const downloadQrBtn = document.getElementById('download-qr-btn');
    if (downloadQrBtn) {
        downloadQrBtn.addEventListener('click', function () {
            const qrContainer = document.getElementById('qrcode');
            const imgElement = qrContainer.querySelector('img');
            const canvasElement = qrContainer.querySelector('canvas');

            let downloadUrl = '';

            if (imgElement && imgElement.src && imgElement.src.startsWith('data:image')) {
                downloadUrl = imgElement.src;
            } else if (canvasElement) {
                downloadUrl = canvasElement.toDataURL("image/png");
            }

            if (downloadUrl) {
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = "wedding-qr.png";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }
});
