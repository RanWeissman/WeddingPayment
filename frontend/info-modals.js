// Information & Marketing Modals for Gift4Event (Why Us, How It Works, Who Are We, Privacy, Live Example)

const INFO_MODALS_HTML = `
    <!-- About Modal -->
    <div id="about-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closeAboutModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="about-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h3 class="text-2xl font-extrabold text-indigo-950">למה Gift4Event?</h3>
                <button type="button" onclick="closeAboutModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto text-gray-600 space-y-6">
                <p class="text-base md:text-lg leading-relaxed">
                    פלטפורמות המתנות הקיימות גובות עמלות גבוהות מכם או מהאורחים שלכם, בעוד שאפליקציות התשלום החינמיות חוסמות קבלת כסף ברגע שמגיעים לתקרה השנתית. המערכת נבנתה כדי לאפשר לכם לקבל מתנות ישירות לחשבון – ללא עמלות, ללא חסימות ובפרטיות מלאה.
                </p>

                <div class="space-y-4">
                    <!-- Feature 1 -->
                    <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-gray-900 mb-1">0% עמלות – כל שקל עובר אליכם</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                הכסף עובר ישירות מהאורחים לחשבון שלכם, בלי מתווכים באמצע ובלי דמי שירות לכם או לאורחים.
                            </p>
                        </div>
                    </div>

                    <!-- Feature 2 -->
                    <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-gray-900 mb-1">ללא חסימות ותקרות – עידוד להעברה בנקאית וניתוב חכם</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                לאפליקציות כמו ביט ופייבוקס יש תקרת קבלה שנתית שלעיתים נגמרת בדיוק בשיא האירוע. לכן המערכת מעוצבת כך שהיא מעודדת את האורחים לבצע העברה בנקאית ישירה (המסלול היחיד שפתוח תמיד וללא הגבלת סכום) עם העתקת פרטים בלחיצה אחת, ובמקביל מאפשרת להזין שני חשבונות ביט ופייבוקס לחלוקת עומסים אוטומטית.
                            </p>
                        </div>
                    </div>

                    <!-- Feature 3 -->
                    <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-gray-900 mb-1">פשטות מקסימלית – ללא הרשמה וללא הגדרות מסובכות</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                תוך שתי דקות של מילוי טופס קצר מקבלים מיד קישור לשליחה בוואטסאפ, ברקוד להזמנה ושלט מוכן להדפסה לתלייה בחתונה, בלי לפתוח משתמש ובלי לחתום על חוזים.
                            </p>
                        </div>
                    </div>

                    <!-- Feature 4 -->
                    <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                        </div>
                        <div class="space-y-2">
                            <h4 class="text-lg font-bold text-gray-900">פרטיות מלאה וחלון זמנים אוטומטי</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                דף המתנה פתוח להעברות עד שבוע ימים לאחר האירוע, ולאחר מכן ננעל אוטומטית והופך לכרטיס תודה לאורחים. פרטי החשבון מוצפנים, מוסתרים ממנועי חיפוש ולא נשארים חשופים ברשת אחרי החתונה.
                            </p>
                            <button type="button" onclick="closeAboutModal(); setTimeout(openPrivacyModal, 150);"
                                class="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-4 transition-colors pt-0.5">
                                <span>איך אנחנו שומרים על הפרטיות שלכם? לחצו כאן</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Feature 5 -->
                    <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-gray-900 mb-1">חוויה אלגנטית ונוחה לאורחים</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                האורחים מעבירים מתנה תוך שניות דרך האפליקציות שהם כבר מכירים בטלפון, בממשק נקי ומכובד וללא תחושת סליקה מסחרית.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                <button type="button" onclick="closeAboutModal()"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm">
                    הבנתי, תודה!
                </button>
            </div>
        </div>
    </div>

    <!-- How it Works Modal -->
    <div id="how-it-works-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closeHowItWorksModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="how-it-works-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h3 class="text-2xl font-extrabold text-indigo-950">איך זה עובד?</h3>
                <button type="button" onclick="closeHowItWorksModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto text-gray-600 space-y-6">
                <p class="text-base md:text-lg leading-relaxed">
                    בשלושה שלבים פשוטים ומבלי להירשם, תקבלו דף מתנה אישי, ברקוד להזמנה ושלט מעוצב לתלייה בחתונה:
                </p>

                <div class="space-y-4">
                    <!-- Step 1 -->
                    <div class="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg mt-0.5">
                            1
                        </div>
                        <div class="space-y-2 flex-1">
                            <h4 class="font-bold text-lg text-gray-900">ממלאים את פרטי האירוע והחשבון</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                מזינים בטופס את שמותיכם, תאריך האירוע ופרטי חשבון הבנק להעברה ישירה. מומלץ להוסיף גם שני חשבונות ביט ופייבוקס (חתן וכלה) לחלוקת עומסים אוטומטית, וקישור ניווט לאולם.
                            </p>
                        </div>
                    </div>

                    <!-- Step 2 -->
                    <div class="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg mt-0.5">
                            2
                        </div>
                        <div class="space-y-2 flex-1">
                            <h4 class="font-bold text-lg text-gray-900">מקבלים מיד קישור, ברקוד ושלט לתלייה בחתונה</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                בלחיצה על כפתור היצירה המערכת מפיקה עבורכם במקום שלושה תוצרים מוכנים:
                            </p>
                            <ul class="space-y-2 pt-1 text-base text-gray-600">
                                <li class="flex items-start gap-2.5">
                                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 shrink-0"></span>
                                    <span><strong class="text-gray-900">קישור אישי קצר:</strong> לשליחה לאורחים בוואטסאפ או בהודעות.</span>
                                </li>
                                <li class="flex items-start gap-2.5">
                                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 shrink-0"></span>
                                    <span><strong class="text-gray-900">תמונת ברקוד (QR):</strong> להורדה ושילוב בעיצוב ההזמנה.</span>
                                </li>
                                <li class="flex items-start gap-2.5">
                                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 shrink-0"></span>
                                    <span><strong class="text-gray-900">שלט מעוצב להדפסה (PDF):</strong> להצבה בכניסה לאולם או על השולחנות.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Step 3 -->
                    <div class="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg mt-0.5">
                            3
                        </div>
                        <div class="space-y-2 flex-1">
                            <h4 class="font-bold text-lg text-gray-900">האורחים מעבירים בקלות – והדף ננעל מעצמו אחרי האירוע</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                האורחים סורקים את השלט בחתונה או לוחצים על הקישור, ומעבירים מתנה דרך הבנק, ביט או פייבוקס ללא עמלות. שבוע לאחר האירוע פרטי החשבון מוסרים אוטומטית והדף הופך לכרטיס תודה.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                <button type="button" onclick="closeHowItWorksModal()"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm">
                    הבנתי, תודה!
                </button>
            </div>
        </div>
    </div>

    <!-- Who Are We Modal -->
    <div id="who-are-we-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closeWhoAreWeModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="who-are-we-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h3 class="text-2xl font-extrabold text-indigo-950">מי אנחנו?</h3>
                <button type="button" onclick="closeWhoAreWeModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto text-gray-600 space-y-5">
                <p class="text-base md:text-lg leading-relaxed">
                    הכל התחיל כשחיפשתי דרך לעזור לאחי בניהול האירוע שלו. כמתכנת, הבנתי שאפשר לעקוף את העמלות הגבוהות ואת המגבלות הטכניות של הפלטפורמות הקיימות, וליצור פתרון נקי, הוגן וקהילתי.
                </p>
                <p class="text-base md:text-lg leading-relaxed">
                    מהר מאוד הבנתי שהכלי הזה יכול להעניק לעוד המון זוגות ובעלי אירועים את האפשרות לחסוך כסף וליהנות משקט נפשי ביום המאושר שלהם. אני מאמין גדול בשיתוף ידע ובערך של פתרונות חכמים ופשוטים.
                </p>
                <p class="text-base md:text-lg leading-relaxed">
                    המטרה שלי היא להמשיך ולשפר את המערכת עבורכם. יש לכם הצעת ייעול, פידבק או רעיון לפיצ'ר חדש? אשמח מאוד לשמוע מכם.
                </p>

                <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 text-center space-y-3">
                    <p class="text-lg font-bold text-gray-900">רן וייסמן</p>
                    <a href="mailto:ranw535@gmail.com"
                        class="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors flex items-center justify-center gap-2 text-base font-medium">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z">
                            </path>
                        </svg>
                        ranw535@gmail.com
                    </a>
                    <div class="pt-1">
                        <a href="https://www.linkedin.com/in/ranweissman/" target="_blank" rel="noopener noreferrer"
                            class="inline-flex items-center justify-center gap-2 bg-[#0077b5] hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm w-full sm:w-auto">
                            <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                            פרופיל הלינקדאין שלי
                        </a>
                    </div>
                </div>
            </div>
            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                <button type="button" onclick="closeWhoAreWeModal()"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm">
                    הבנתי, תודה!
                </button>
            </div>
        </div>
    </div>

    <!-- Privacy & Security Modal -->
    <div id="privacy-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closePrivacyModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="privacy-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h3 class="text-2xl font-extrabold text-indigo-950">פרטיות ואבטחה ברמת-על</h3>
                <button type="button" onclick="closePrivacyModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto text-gray-600 space-y-6">
                <p class="text-base md:text-lg leading-relaxed">
                    הפרטים הבנקאיים שלכם נועדו אך ורק עבור האורחים שלכם ובזמן האירוע – הם לא צריכים להישאר חשופים באינטרנט לנצח. כך אנחנו שומרים עליכם:
                </p>

                <div class="space-y-4">
                    <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg mt-0.5">
                            1
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900 text-lg mb-1">חלון זמנים חכם (נעילה אוטומטית)</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                דף המתנה פתוח להעברות עד שבוע ימים לאחר תאריך האירוע, כדי לאפשר גם לאורחים שמעבירים מתנה אחרי החתונה לעשות זאת בנחת. מיד לאחר מכן, פרטי הבנק והאפליקציות ננעלים ומוסרים לחלוטין מהדף, ובמקומם מוצג לאורחים כרטיס תודה מעוצב.
                            </p>
                        </div>
                    </div>

                    <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg mt-0.5">
                            2
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900 text-lg mb-1">חשיפה לאורחים בלבד</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                פרטי החשבון מוסתרים כברירת מחדל ונחשפים רק בלחיצת כפתור מכוונת של אורח אמיתי שנכנס לדף.
                            </p>
                        </div>
                    </div>

                    <div class="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-start gap-4">
                        <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg mt-0.5">
                            3
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900 text-lg mb-1">הצפנה ודיסקרטיות מלאה</h4>
                            <p class="text-base text-gray-600 leading-relaxed">
                                הנתונים נשמרים בצורה מוצפנת ומאובטחת, הדף חסום להופעה במנועי חיפוש כך שגוגל לא יציג את דף המתנה בחיפוש השמות שלכם, והמערכת מוגנת מפני סריקות אוטומטיות ובוטים.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                <button type="button" onclick="closePrivacyModal()"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm">
                    הבנתי, תודה!
                </button>
            </div>
        </div>
    </div>

    <!-- Live Example Modal -->
    <div id="live-example-modal"
        class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onclick="closeLiveExampleModal()"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="live-example-content" dir="rtl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h3 class="text-2xl font-extrabold text-indigo-950">דף מתנה לדוגמא</h3>
                <button type="button" onclick="closeLiveExampleModal()"
                    class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto text-gray-600 flex flex-col gap-4">
                <p class="text-center text-base md:text-lg leading-relaxed mb-1">בעת יצירת דף מתנה תקבלו עם הפרטים שלכם את הקבצים הבאים:</p>
                
                <!-- Button A -->
                <a href="https://gift4event.com/roni-and-ran-KOZL" target="_blank"
                    class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg text-center flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    לדף האירוע לדוגמה (דיגיטלי)
                </a>

                <!-- Button B -->
                <a href="assets/qr_page_example.pdf" target="_blank"
                    class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg text-center flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    להורדת דף אירוע מעוצב (להדפסה - PDF)
                </a>
            </div>
        </div>
    </div>
`;

// Inject info modals into #modals-root on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('modals-root');
    if (root) {
        root.insertAdjacentHTML('beforeend', INFO_MODALS_HTML);
    }
});

// Unified open/close helpers
function openModalById(modalId, contentId) {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(contentId);
    if (!modal || !content) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function closeModalById(modalId, contentId) {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(contentId);
    if (!modal || !content) return;
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Public Info Modal Functions
function openAboutModal() { openModalById('about-modal', 'about-content'); }
function closeAboutModal() { closeModalById('about-modal', 'about-content'); }

function openHowItWorksModal() { openModalById('how-it-works-modal', 'how-it-works-content'); }
function closeHowItWorksModal() { closeModalById('how-it-works-modal', 'how-it-works-content'); }

function openWhoAreWeModal() { openModalById('who-are-we-modal', 'who-are-we-content'); }
function closeWhoAreWeModal() { closeModalById('who-are-we-modal', 'who-are-we-content'); }

function openPrivacyModal() { openModalById('privacy-modal', 'privacy-content'); }
function closePrivacyModal() { closeModalById('privacy-modal', 'privacy-content'); }

function openLiveExampleModal() { openModalById('live-example-modal', 'live-example-content'); }
function closeLiveExampleModal() { closeModalById('live-example-modal', 'live-example-content'); }
