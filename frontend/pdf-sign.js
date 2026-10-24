// Printable A4 Wedding Sign (PDF) Template & Generator for Gift4Event

const PDF_SIGN_TEMPLATE_HTML = `
    <!-- Hidden PDF Template -->
    <div id="pdf-template" class="absolute left-[-9999px] top-[-9999px] w-[595px] h-[842px] bg-white flex flex-col items-center justify-between p-12" dir="rtl">
        <!-- Top Right Flower -->
        <div class="absolute top-0 right-0 w-64 h-64 z-0">
            <img src="assets/flower-right-up.jpg" class="w-full h-full object-contain">
        </div>
        
        <!-- Bottom Left Flower -->
        <div class="absolute bottom-0 left-0 w-64 h-64 z-0">
            <img src="assets/flower-ledt-down.jpg" class="w-full h-full object-contain">
        </div>

        <div class="flex-1 flex flex-col items-center justify-center gap-12 w-full mt-24 mb-24 relative z-10" style="font-family: 'Varela Round', sans-serif;">
            <h1 class="text-5xl font-bold text-stone-700">להעברה דיגיטלית</h1>
            
            <div class="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-sm">
                <div id="pdf-qrcode"></div>
            </div>
            
            <h2 id="pdf-couple-names" class="text-5xl font-bold text-stone-600"></h2>
        </div>
    </div>
`;

// Populate the hidden PDF sign template when a link is generated
function updatePdfSignData(shareableUrl, coupleNames) {
    const pdfQrContainer = document.getElementById('pdf-qrcode');
    if (pdfQrContainer) {
        pdfQrContainer.innerHTML = '';
        new QRCode(pdfQrContainer, {
            text: shareableUrl,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    const pdfCoupleNames = document.getElementById('pdf-couple-names');
    if (pdfCoupleNames) {
        pdfCoupleNames.innerText = coupleNames;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inject the hidden PDF template into the page
    document.body.insertAdjacentHTML('beforeend', PDF_SIGN_TEMPLATE_HTML);

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
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>מייצר PDF...</span>
            `;
            btn.disabled = true;

            setTimeout(async () => {
                try {
                    const canvas = await html2canvas(template, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
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
