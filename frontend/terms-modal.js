// Terms of Use, Privacy Policy (Amendment 13) & Liability Disclaimer Modal for Gift4Event

const TERMS_MODAL_HTML = `
    <!-- Terms of Use & Privacy Policy Modal -->
    <div id="terms-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closeTermsModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="terms-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <div>
                    <h3 class="text-2xl font-extrabold text-indigo-950">תנאי שימוש ומדיניות פרטיות</h3>
                    <p class="text-xs text-gray-500 mt-1">תקנון השימוש במערכת Gift4Event, הגבלת אחריות ומדיניות הגנת הפרטיות</p>
                </div>
                <button type="button" onclick="closeTermsModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>

            <div class="p-6 overflow-y-auto text-gray-600 space-y-5 text-sm md:text-base leading-relaxed">
                <p class="text-gray-700 font-medium bg-indigo-50/70 border border-indigo-100 p-4 rounded-xl">
                    ברוכים הבאים ל-<strong>Gift4Event</strong>. השימוש באתר וביצירת דף מתנה לאירוע כפוף לתנאים המפורטים להלן. סימון תיבת האישור בטופס היצירה מהווה הסכמה מפורשת ומחייבת לתנאים אלו.
                </p>

                <!-- Section 1 -->
                <div class="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <h4 class="font-bold text-gray-900 text-base">1. מהות השירות והיעדר מעורבות פיננסית</h4>
                    <p>
                        מערכת Gift4Event הינה כלי טכנולוגי חינמי להצגה ויזואלית של דרכי העברת מתנות וניווט לאירוע בלבד. <strong>האתר אינו מוסד פיננסי, אינו בנק, אינו חברת סליקה, אינו מעביר כספים ואינו מחזיק בכספים בנאמנות.</strong> כל העברה כספית מתבצעת ישירות בין האורח לבין בעלי האירוע באמצעות חשבון הבנק שלהם או אפליקציות צד שלישי (כגון Bit ו-PayBox) ובכפוף לתנאי השימוש של אותן פלטפורמות.
                    </p>
                </div>

                <!-- Section 2 -->
                <div class="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <h4 class="font-bold text-gray-900 text-base">2. אחריות בלעדית לנכונות הפרטים ובדיקת הקישור</h4>
                    <p>
                        בעלי האירוע מצהירים כי הפרטים שהזינו בטופס (לרבות שם המוטב, שם הבנק, מספר הסניף, מספר החשבון, קודי ה-QR של Bit וקישורי PayBox ו-Waze) שייכים להם, הוזנו מרצונם החופשי ונבדקו על ידם בקפידה. <strong>חלה על בעלי האירוע חובת בדיקה עצמית</strong> של דף המתנה, הקישור והברקוד שנוצרו טרם הפצתם לאורחים או הדפסתם. מפעילי האתר לא יישאו בכל אחריות לטעות הקלדה, שגיאה במספר חשבון או סניף, קישור שגוי או העברה שבוצעה לחשבון אחר עקב פרטים שגויים שהוזנו על ידי המשתמש.
                    </p>
                </div>

                <!-- Section 3 -->
                <div class="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <h4 class="font-bold text-gray-900 text-base">3. אספקת השירות כמות שהוא (AS-IS) והגבלת אחריות</h4>
                    <p>
                        השירות ניתן לשימוש כמות שהוא (<strong>AS-IS</strong>) ובהתאם לזמינותו (As Available), ללא מצג או התחייבות לזמינות רציפה וללא תקלות. מפעילי האתר לא יישאו בכל אחריות לנזק ישיר, עקיף, תוצאתי או כספי שייגרם למשתמשים או לאורחיהם, לרבות בגין עיכוב או כשל בהעברה בנקאית, הגעה לתקרת קבלה שנתית או חסימת חשבון באפליקציות Bit / PayBox, תקלות תקשורת או קליטה סלולרית באולם האירועים, או תקלות בשירותי ענן וצד שלישי.
                    </p>
                </div>

                <!-- Section 4 -->
                <div class="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <h4 class="font-bold text-gray-900 text-base">4. מדיניות פרטיות ושמירת מידע (חוק הגנת הפרטיות – תיקון 13)</h4>
                    <ul class="list-disc list-inside space-y-1.5 text-gray-600">
                        <li><strong>הסכמה מדעת להצגת הפרטים:</strong> מסירת הפרטים בטופס נעשית מרצונם החופשי של בעלי האירוע, במטרה להציגם לכל אדם שיחזיק בקישור או בברקוד האירוע שיופץ על ידם.</li>
                        <li><strong>אבטחה והצפנה:</strong> הנתונים נשמרים בצורה מוצפנת ומאובטחת, ומספר חשבון הבנק מוצג לאורחים באופן מוסתר כברירת מחדל עד ללחיצה יזומה של האורח.</li>
                        <li><strong>חלון זמנים ונעילה אוטומטית:</strong> גישת אורחים לפרטי הבנק והקישורים בדף המתנה פתוחה עד 7 ימים לאחר תאריך האירוע שהוזן, ולאחר מכן הדף ננעל אוטומטית לצפייה בפרטי התשלום.</li>
                        <li><strong>נתונים טכניים ואבטחת שימוש:</strong> המערכת אוספת נתונים טכניים וסטטיסטיים אנונימיים לצורכי תפעול השירות, שיפור חוויית המשתמש, אבטחת מידע ומניעת שימוש לרעה בלבד. המידע אינו נמכר ואינו מועבר לצדדים שלישיים.</li>
                    </ul>
                </div>

                <!-- Section 5 -->
                <div class="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <h4 class="font-bold text-gray-900 text-base">5. נעילת פרטים מפני שינוי ואיסור שימוש לרעה</h4>
                    <p>
                        מטעמי אבטחה ומניעת הונאות, לאחר יצירת דף מתנה לא ניתן לערוך או לדרוס את פרטי הבנק שהוזנו בו; במקרה של טעות בהזנה יש ליצור דף חדש ולהפיץ לאורחים את הקישור החדש בלבד. חל איסור מוחלט להזין פרטים של אדם אחר ללא הרשאתו, להשתמש באתר לצורכי התחזות, הונאה או פעילות בלתי חוקית, או לבצע סריקה אוטומטית של דפי האתר.
                    </p>
                </div>

                <!-- Section 6 -->
                <div class="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <h4 class="font-bold text-gray-900 text-base">6. קניין רוחני, זכות פנייה והדין החל</h4>
                    <p>
                        כל זכויות היוצרים והקניין הרוחני באתר שמורות ל-Gift4Event. על תנאי שימוש אלו יחולו דיני מדינת ישראל בלבד. לכל שאלה, בירור או בקשה להסרת דף אירוע מוקדמת ניתן לפנות למפעילי האתר דרך ערוצי הקשר המופיעים בחלונית "מי אנחנו?".
                    </p>
                </div>
            </div>

            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0 flex flex-col sm:flex-row gap-3">
                <button type="button" onclick="acceptTermsFromModal()"
                    class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm">
                    קראתי ואני מאשר/ת את התנאים ✓
                </button>
                <button type="button" onclick="closeTermsModal()"
                    class="sm:w-36 bg-white hover:bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 transition-colors">
                    סגירה
                </button>
            </div>
        </div>
    </div>
`;

// Inject terms modal into #modals-root on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('modals-root');
    if (root) {
        root.insertAdjacentHTML('beforeend', TERMS_MODAL_HTML);
    }
});

function openTermsModal() {
    openModalById('terms-modal', 'terms-content');
}

function closeTermsModal() {
    closeModalById('terms-modal', 'terms-content');
}

function acceptTermsFromModal() {
    const checkbox = document.getElementById('terms-consent');
    const errorEl = document.getElementById('terms-consent-error');
    const wrapperEl = document.getElementById('terms-consent-wrapper');
    if (checkbox) {
        checkbox.checked = true;
    }
    if (errorEl) {
        errorEl.classList.add('hidden');
    }
    if (wrapperEl) {
        wrapperEl.classList.remove('border-red-300', 'bg-red-50/60');
        wrapperEl.classList.add('border-indigo-100', 'bg-white/80');
    }
    closeTermsModal();
}
