// Step-by-Step Link Extraction Guide Modals for Gift4Event (Bit QR, PayBox Group Link, Waze Location Link, Why 2 Codes)

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

    <!-- Bit Why Two Codes Modal -->
    <div id="bit-why-two-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closeBitWhyTwoModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="bit-why-two-content" dir="rtl">
            <div class="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 shrink-0">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg sm:text-xl font-extrabold text-indigo-950">למה כדאי להוסיף שני קודי Bit?</h3>
                </div>
                <button type="button" onclick="closeBitWhyTwoModal()" aria-label="סגירה"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="p-5 sm:p-6 overflow-y-auto text-gray-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                    ב-Bit ניתן לקבל עד <strong class="text-gray-900 font-extrabold">25,000 ₪ בשנה ללא עמלה</strong>. מעבר לסכום זה נגבית עמלה של <strong class="text-rose-600 font-bold">0.8%</strong> על הסכום החורג.
                </p>
                <p>
                    הוספת שני קודים של בעלי האירוע מאפשרת לחלק את המתנות בין שני חשבונות, וכך להימנע מעמלות כל עוד כל אחד לא עבר את התקרה האישית שלו.
                </p>

                <!-- Short Example Box -->
                <div class="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4 space-y-2.5">
                    <p class="font-extrabold text-gray-900 text-sm sm:text-base">
                        <span class="text-rose-700">40,000 ₪ במתנות:</span>
                    </p>
                    <ul class="space-y-2 text-sm">
                        <li class="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 border border-rose-100">
                            <span class="font-medium text-gray-700">חשבון אחד:</span>
                            <span class="font-extrabold text-rose-600">120 ₪ עמלה</span>
                        </li>
                        <li class="flex items-center justify-between bg-emerald-50/90 rounded-lg px-3 py-2 border border-emerald-200">
                            <span class="font-semibold text-gray-800">שני חשבונות (20,000 ₪ לכל אחד):</span>
                            <span class="font-extrabold text-emerald-700">0 ₪ עמלה</span>
                        </li>
                    </ul>
                </div>

                <p class="text-xs text-gray-500 italic">
                    *בהנחה שלשני החשבונות נותרה תקרה פנויה.
                </p>
            </div>

            <div class="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                <button type="button" onclick="closeBitWhyTwoModal()"
                    class="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm cursor-pointer">
                    הבנתי
                </button>
            </div>
        </div>
    </div>

    <!-- PayBox Why Two Codes Modal -->
    <div id="paybox-why-two-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closePayboxWhyTwoModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="paybox-why-two-content" dir="rtl">
            <div class="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 shrink-0">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg sm:text-xl font-extrabold text-indigo-950">למה כדאי להוסיף שני קודי PayBox?</h3>
                </div>
                <button type="button" onclick="closePayboxWhyTwoModal()" aria-label="סגירה"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="p-5 sm:p-6 overflow-y-auto text-gray-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                    ב-PayBox Basic ניתן לקבל עד <strong class="text-gray-900 font-extrabold">50,000 ₪ בשנה ללא עמלת קבלה</strong>.
                </p>
                <p>
                    הוספת שני קודים של בעלי האירוע מאפשרת לחלק את המתנות בין שני חשבונות ולהגדיל את הסכום הכולל שניתן לקבל במסגרת התקרות האישיות.
                </p>

                <!-- Short Example Box -->
                <div class="bg-cyan-50/60 border border-cyan-200/80 rounded-xl p-4 space-y-2.5">
                    <p class="font-extrabold text-gray-900 text-sm sm:text-base">
                        <span class="text-cyan-800">80,000 ₪ במתנות:</span>
                    </p>
                    <ul class="space-y-2 text-sm">
                        <li class="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 border border-cyan-100">
                            <span class="font-medium text-gray-700">חשבון אחד:</span>
                            <span class="font-extrabold text-rose-600">חורג מתקרת Basic</span>
                        </li>
                        <li class="flex items-center justify-between bg-emerald-50/90 rounded-lg px-3 py-2 border border-emerald-200">
                            <span class="font-semibold text-gray-800">שני חשבונות (40,000 ₪ לכל אחד):</span>
                            <span class="font-extrabold text-emerald-700">במסגרת התקרה של שניהם</span>
                        </li>
                    </ul>
                </div>

                <p class="text-xs text-gray-500 italic">
                    *בהנחה שלשני החשבונות נותרה תקרה פנויה ובהתאם לתנאי השירות.
                </p>
            </div>

            <div class="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                <button type="button" onclick="closePayboxWhyTwoModal()"
                    class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm cursor-pointer">
                    הבנתי
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

function openBitWhyTwoModal() { openModalById('bit-why-two-modal', 'bit-why-two-content'); }
function closeBitWhyTwoModal() { closeModalById('bit-why-two-modal', 'bit-why-two-content'); }

function openPayboxGuideModal() { openModalById('paybox-guide-modal', 'paybox-guide-content'); }
function closePayboxGuideModal() { closeModalById('paybox-guide-modal', 'paybox-guide-content'); }

function openPayboxWhyTwoModal() { openModalById('paybox-why-two-modal', 'paybox-why-two-content'); }
function closePayboxWhyTwoModal() { closeModalById('paybox-why-two-modal', 'paybox-why-two-content'); }

function openWazeGuideModal() { openModalById('waze-guide-modal', 'waze-guide-content'); }
function closeWazeGuideModal() { closeModalById('waze-guide-modal', 'waze-guide-content'); }
