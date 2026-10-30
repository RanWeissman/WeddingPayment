// Printable A4 Event Sign (PDF) Template & Generator for Gift4Event

function buildSignInnerHtml(coupleId, qrId, gradPrefix, compensateHtml2Canvas, prefixId) {
    const resolvedPrefixId = prefixId || `${coupleId}-prefix`;
    const coupleTopStyle = compensateHtml2Canvas
        ? "font-family: 'Frank Ruhl Libre', serif; position: relative; top: -8px;"
        : "font-family: 'Frank Ruhl Libre', serif;";
    const pillSpanStyle = compensateHtml2Canvas ? "position: relative; top: -6px;" : "";
    const footerOffsetStyle = compensateHtml2Canvas ? "position: relative; top: -4px;" : "";

    return `
        <!-- Top Right Botanical Flower -->
        <div class="absolute top-0 right-0 w-64 h-64 z-0 pointer-events-none">
            <img src="assets/flower-right-up.jpg" class="w-full h-full object-contain mix-blend-multiply opacity-90">
        </div>
        
        <!-- Bottom Left Botanical Flower -->
        <div class="absolute bottom-0 left-0 w-64 h-64 z-0 pointer-events-none">
            <img src="assets/flower-ledt-down.jpg" class="w-full h-full object-contain mix-blend-multiply opacity-90">
        </div>

        <!-- Delicate Inner Gold Frame -->
        <div class="absolute inset-6 border-2 border-[#D8C5A8]/65 rounded-[28px] pointer-events-none z-10"></div>
        <div class="absolute inset-[30px] border border-[#D8C5A8]/35 rounded-[23px] pointer-events-none z-10"></div>

        <!-- Top Section: Rings & Event Title / Names -->
        <div class="relative z-20 flex flex-col items-center text-center mt-6 w-full max-w-[460px] px-3">
            <!-- Intertwined Gold Wedding Rings + Heart -->
            <div class="mb-2.5 flex flex-col items-center">
                <svg class="w-5 h-5 text-[#C69C6D] mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <svg class="w-24 h-14" viewBox="0 0 80 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="${gradPrefix}1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#E6C687" />
                            <stop offset="50%" stop-color="#B88644" />
                            <stop offset="100%" stop-color="#F0D7A3" />
                        </linearGradient>
                        <linearGradient id="${gradPrefix}2" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#F0D7A3" />
                            <stop offset="50%" stop-color="#C5934C" />
                            <stop offset="100%" stop-color="#9A6B2E" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="30" cy="24" rx="16" ry="13" transform="rotate(-12 30 24)" stroke="url(#${gradPrefix}1)" stroke-width="3.5" />
                    <ellipse cx="49" cy="24" rx="16" ry="13" transform="rotate(10 49 24)" stroke="url(#${gradPrefix}2)" stroke-width="3.5" />
                </svg>
            </div>

            <p id="${resolvedPrefixId}" class="text-xl font-bold text-[#7A7267] tracking-wide mb-0.5 max-w-[440px] break-words">
                החתונה של
            </p>
            <h1 id="${coupleId}" class="text-[3.75rem] font-bold text-[#1F192E] leading-none mb-7 max-w-[450px] break-words" style="${coupleTopStyle}"></h1>

            <!-- Gold Divider with Heart -->
            <div class="flex items-center justify-center gap-4 w-64 mt-1.5">
                <div class="h-[1.5px] flex-1 bg-[#D5C3AA]"></div>
                <svg class="w-5 h-5 text-[#C69C6D] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <div class="h-[1.5px] flex-1 bg-[#D5C3AA]"></div>
            </div>
        </div>

        <!-- Middle Section: Call to Action & QR Code -->
        <div class="relative z-20 flex flex-col items-center text-center my-auto">
            <h2 class="text-[2.1rem] font-extrabold text-[#1F192E] leading-tight mb-8">
                סרקו לשליחת מתנה
            </h2>

            <!-- QR Frame -->
            <div class="p-6 bg-white border-2 border-[#E2D3BC] rounded-[28px] shadow-md mb-5">
                <div id="${qrId}"></div>
            </div>

            <!-- Zero-Fee Pill -->
            <div class="bg-[#F5F0FF] border border-[#DDD0FA] rounded-full h-[36px] px-7 flex items-center justify-center">
                <span class="text-sm font-bold text-[#4A25AA] leading-none whitespace-nowrap" style="${pillSpanStyle}">
                    שליחת מתנה ללא עמלות
                </span>
            </div>
        </div>

        <!-- Bottom Section: Gift4Event Signature (Matches payment.html) -->
        <div class="relative z-20 flex flex-col items-center text-center w-full mb-3">
            <div class="pt-3.5 border-t border-[#D5C3AA]/50 w-72 flex items-center justify-center gap-2">
                <span class="inline-flex items-center gap-1" dir="ltr">
                    <img src="assets/logo.png" alt="Gift4Event Icon" class="w-6 h-6 object-contain shrink-0">
                    <img src="assets/Gift4Event.PNG" alt="Gift4Event" class="h-5 w-auto object-contain shrink-0">
                </span>
                <span class="text-[#C69C6D] text-sm leading-none" style="${footerOffsetStyle}">·</span>
                <img src="assets/Slogan.png" alt="עמלות? לא בשמחות!" class="h-[14px] w-auto object-contain shrink-0">
            </div>
        </div>
    `;
}

const PDF_SIGN_TEMPLATE_HTML = `
    <!-- Hidden PDF Template Wrapper (0x0 overflow-hidden so 595px A4 canvas never causes mobile horizontal scroll) -->
    <div style="position: fixed; top: 0; left: 0; width: 0; height: 0; overflow: hidden; pointer-events: none; z-index: -9999;" aria-hidden="true">
        <div id="pdf-template" class="w-[595px] h-[842px] bg-[#FFFEFB] flex flex-col items-center justify-between px-12 py-11 overflow-hidden relative" dir="rtl" style="font-family: 'Assistant', sans-serif;">
            ${buildSignInnerHtml('pdf-couple-names', 'pdf-qrcode', 'pdfGoldGrad', true, 'pdf-event-prefix')}
        </div>
    </div>
`;

/**
 * Automatically adjusts the font size and spacing of the PDF sign heading
 * when names are long so text never overflows the gold frame or overlaps.
 */
function applyAdaptiveSignTypography(headingEl, namesText) {
    if (!headingEl) return;
    const len = String(namesText || '').trim().length;

    if (len <= 14) {
        headingEl.style.fontSize = '3.75rem';
        headingEl.style.lineHeight = '1.05';
        headingEl.style.marginBottom = '1.75rem';
    } else if (len <= 20) {
        headingEl.style.fontSize = '3rem';
        headingEl.style.lineHeight = '1.1';
        headingEl.style.marginBottom = '1.25rem';
    } else if (len <= 28) {
        headingEl.style.fontSize = '2.35rem';
        headingEl.style.lineHeight = '1.15';
        headingEl.style.marginBottom = '1rem';
    } else {
        headingEl.style.fontSize = '1.85rem';
        headingEl.style.lineHeight = '1.2';
        headingEl.style.marginBottom = '0.75rem';
    }
}

// Populate both the hidden PDF sign template and the live miniature preview in Card 3
function updatePdfSignData(shareableUrl, coupleNames, eventConfig = {}) {
    const titleData = (typeof buildEventTitle === 'function')
        ? buildEventTitle({
            eventType: eventConfig.eventType || 'wedding',
            eventSubType: eventConfig.eventSubType || '',
            customEventName: eventConfig.customEventName || '',
            coupleNames: coupleNames,
            useSampleFallback: false
        })
        : {
            prefix: 'החתונה של',
            names: coupleNames || ''
        };

    const pdfQrContainer = document.getElementById('pdf-qrcode');
    if (pdfQrContainer) {
        pdfQrContainer.innerHTML = '';
        new QRCode(pdfQrContainer, {
            text: shareableUrl,
            width: 248,
            height: 248,
            colorDark: "#141020",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    const pdfEventPrefix = document.getElementById('pdf-event-prefix');
    if (pdfEventPrefix) {
        pdfEventPrefix.innerText = titleData.prefix;
    }

    const pdfCoupleNames = document.getElementById('pdf-couple-names');
    if (pdfCoupleNames) {
        pdfCoupleNames.innerText = titleData.names;
        applyAdaptiveSignTypography(pdfCoupleNames, titleData.names);
    }

    // Also update the live miniature preview in Card 3
    const previewQrContainer = document.getElementById('pdf-preview-qrcode');
    if (previewQrContainer) {
        previewQrContainer.innerHTML = '';
        new QRCode(previewQrContainer, {
            text: shareableUrl,
            width: 248,
            height: 248,
            colorDark: "#141020",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    const previewEventPrefix = document.getElementById('pdf-preview-event-prefix');
    if (previewEventPrefix) {
        previewEventPrefix.innerText = titleData.prefix;
    }

    const previewCoupleNames = document.getElementById('pdf-preview-couple-names');
    if (previewCoupleNames) {
        previewCoupleNames.innerText = titleData.names;
        applyAdaptiveSignTypography(previewCoupleNames, titleData.names);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inject the hidden PDF template into the page
    document.body.insertAdjacentHTML('beforeend', PDF_SIGN_TEMPLATE_HTML);

    // Inject the exact miniature preview into Card 3 (#pdf-sign-mini-preview)
    const miniPreviewHost = document.getElementById('pdf-sign-mini-preview');
    if (miniPreviewHost) {
        miniPreviewHost.className = 'relative w-[595px] h-[842px] bg-[#FFFEFB] flex flex-col items-center justify-between px-12 py-11 overflow-hidden origin-top-right';
        miniPreviewHost.setAttribute('dir', 'rtl');
        miniPreviewHost.style.fontFamily = "'Assistant', sans-serif";
        miniPreviewHost.style.transform = 'scale(0.24)';
        miniPreviewHost.innerHTML = buildSignInnerHtml('pdf-preview-couple-names', 'pdf-preview-qrcode', 'pdfMiniGrad', false, 'pdf-preview-event-prefix');
    }

    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', async function () {
            const template = document.getElementById('pdf-template');
            if (!template) {
                alert('שגיאה: תבנית ה-PDF לא נמצאה.');
                return;
            }

            const btn = this;
            const originalContent = btn.innerHTML;
            btn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>מייצר PDF...</span>
            `;
            btn.disabled = true;

            setTimeout(async () => {
                try {
                    const canvas = await html2canvas(template, {
                        scale: 3,
                        useCORS: true,
                        backgroundColor: '#FFFEFB'
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.98);
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                    pdf.save('wedding-qr.pdf');
                } catch (error) {
                    console.error('Error generating PDF:', error);
                    alert('אירעה שגיאה ביצירת ה-PDF. אנא נסו שוב.');
                } finally {
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                }
            }, 500);
        });
    }
});
