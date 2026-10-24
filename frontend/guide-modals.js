// Step-by-Step Link Extraction Guide Modals for Gift4Event (Bit QR, PayBox Group Link, Waze Location Link)

const GUIDE_MODALS_HTML = `
    <!-- Bit Guide Modal -->
    <div id="bit-guide-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closeBitGuideModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform scale-95 transition-transform duration-300"
            id="bit-guide-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 class="text-xl font-extrabold text-indigo-950">איך מפיקים קוד QR אישי ב-Bit?</h3>
                <button type="button" onclick="closeBitGuideModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>
            <div class="p-6 text-gray-600">
                <ol class="space-y-4">
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm mt-0.5">1</div>
                        <p><strong class="text-gray-900">פתחו את האפליקציה:</strong> פותחים את אפליקציית Bit.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm mt-0.5">2</div>
                        <p><strong class="text-gray-900">עוברים לפרופיל:</strong> לוחצים על 'פרופיל' (Profile) בתפריט התחתון.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm mt-0.5">3</div>
                        <p><strong class="text-gray-900">מוצאים את הקוד:</strong> בוחרים באפשרות 'קוד ה-QR הקבוע שלי' (Personal QR).</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm mt-0.5">4</div>
                        <p><strong class="text-gray-900">שומרים ומשתפים:</strong> לוחצים על 'שיתוף הקוד' ושומרים את התמונה בגלריה של הטלפון (או שולחים לעצמכם בוואטסאפ/מייל).</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm mt-0.5">5</div>
                        <p><strong class="text-gray-900">מעלים לכאן:</strong> חוזרים לדף היצירה ומעלים את הקוד ששמרתם במקום המתאים.</p>
                    </li>
                </ol>
            </div>
            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button type="button" onclick="closeBitGuideModal()"
                    class="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm">
                    הבנתי, תודה!
                </button>
            </div>
        </div>
    </div>

    <!-- PayBox Guide Modal -->
    <div id="paybox-guide-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closePayboxGuideModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="paybox-guide-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h3 class="text-xl font-extrabold text-indigo-950">איך מפיקים קישור לקבוצה ב-PayBox</h3>
                <button type="button" onclick="closePayboxGuideModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto text-gray-600">
                <ol class="space-y-4">
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">1</div>
                        <p><strong class="text-gray-900">פתחו את האפליקציה:</strong> פותחים את אפליקציית PayBox.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">2</div>
                        <p><strong class="text-gray-900">מעבר לקבוצות:</strong> בתפריט התחתון לוחצים על 'קבוצות'.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">3</div>
                        <p><strong class="text-gray-900">יצירת קבוצה:</strong> בצד שמאל למטה לוחצים על סימן הפלוס (+).</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">4</div>
                        <p><strong class="text-gray-900">בחירת מטרה:</strong> בוחרים באפשרות 'למטרה אחרת'.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">5</div>
                        <p><strong class="text-gray-900">פרטי הקבוצה:</strong> ממלאים שם קבוצה ותאריך לתשלום (מומלץ לבחור תאריך אחרי האירוע).</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">6</div>
                        <p><strong class="text-gray-900">הגדרות מתקדמות:</strong> לוחצים על 'הגדרות מתקדמות' ומוודאים שהאפשרות 'פומביות' מסומנת.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">7</div>
                        <p><strong class="text-gray-900">פרטיות ותצוגה:</strong> בהגדרות התצוגה מסמנים: הסתרת סכומים, הסתרת יתרה והסתרת חברים.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">8</div>
                        <p><strong class="text-gray-900">סיום הגדרות:</strong> לוחצים על 'סיום' בצד שמאל למעלה.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">9</div>
                        <p><strong class="text-gray-900">המשך:</strong> חוזרים למסך הפרטים ולוחצים על 'הבא' בצד שמאל למעלה.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">10</div>
                        <p><strong class="text-gray-900">סכום:</strong> לוחצים על 'כל סכום'.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">11</div>
                        <p><strong class="text-gray-900">הפקת קישור:</strong> בוחרים 'הזמנה באמצעות קישור'.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm mt-0.5">12</div>
                        <p><strong class="text-gray-900">שמירה:</strong> שולחים את הקישור לעצמכם (וואטסאפ/מייל) ומדביקים אותו כאן באתר.</p>
                    </li>
                </ol>
            </div>
            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                <button type="button" onclick="closePayboxGuideModal()"
                    class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm">
                    הבנתי, תודה!
                </button>
            </div>
        </div>
    </div>

    <!-- Waze Guide Modal -->
    <div id="waze-guide-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closeWazeGuideModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="waze-guide-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h3 class="text-xl font-extrabold text-indigo-950">איך מפיקים קישור Waze</h3>
                <button type="button" onclick="closeWazeGuideModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto text-gray-600">
                <ol class="space-y-4">
                    <li class="flex items-start gap-3">
                        <div class="bg-indigo-100 text-indigo-600 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5">1</div>
                        <p><strong class="text-gray-900">פתחו את האפליקציה:</strong> פותחים את אפליקציית Waze.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="bg-indigo-100 text-indigo-600 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5">2</div>
                        <p><strong class="text-gray-900">הכנסת יעד:</strong> בוחרים את מיקום הנסיעה (מקום האירוע).</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="bg-indigo-100 text-indigo-600 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5">3</div>
                        <p><strong class="text-gray-900">הפקת קישור:</strong> לוחצים על אפשרות 'שיתוף'.</p>
                    </li>
                    <li class="flex items-start gap-3">
                        <div class="bg-indigo-100 text-indigo-600 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5">4</div>
                        <p><strong class="text-gray-900">שמירה:</strong> שולחים את הקישור לעצמכם ומדביקים אותו כאן באתר.</p>
                    </li>
                </ol>
            </div>
            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                <button type="button" onclick="closeWazeGuideModal()"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm">
                    הבנתי, תודה!
                </button>
            </div>
        </div>
    </div>
`;

// Inject guide modals into #modals-root on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('modals-root');
    if (root) {
        root.insertAdjacentHTML('beforeend', GUIDE_MODALS_HTML);
    }
});

// Public Guide Modal Functions (relies on openModalById / closeModalById from info-modals.js)
function openBitGuideModal() { openModalById('bit-guide-modal', 'bit-guide-content'); }
function closeBitGuideModal() { closeModalById('bit-guide-modal', 'bit-guide-content'); }

function openPayboxGuideModal() { openModalById('paybox-guide-modal', 'paybox-guide-content'); }
function closePayboxGuideModal() { closeModalById('paybox-guide-modal', 'paybox-guide-content'); }

function openWazeGuideModal() { openModalById('waze-guide-modal', 'waze-guide-content'); }
function closeWazeGuideModal() { closeModalById('waze-guide-modal', 'waze-guide-content'); }
