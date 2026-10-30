// Guest Payment Page Logic for Gift4Event (payment.html)

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname.replace(/^\/+/, '');
    const isSlug = path && !path.includes('.') && path !== 'payment.html';

    let config = {};
    const mainCardContainer = document.querySelector('.relative.w-full.max-w-lg');
    const originalHTML = mainCardContainer.innerHTML;

    const renderError = (message) => {
        mainCardContainer.innerHTML = `
            <div class="sample-wedding-card relative rounded-[1.85rem] p-8 md:p-12 border-[3px] border-white text-center min-h-[320px] flex flex-col items-center justify-center overflow-hidden">
                <div class="text-red-500 mb-4 bg-red-50/90 p-4 rounded-full border border-red-100">
                    <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h2 class="text-2xl font-extrabold text-[#1F192E] mb-3">שגיאה</h2>
                <p class="text-[#544D63] font-medium">${message}</p>
            </div>
        `;
    };

    const renderExpiredCard = (coupleNames = '') => {
        mainCardContainer.innerHTML = `
            <div class="sample-wedding-card relative rounded-[1.85rem] p-8 md:p-12 border-[3px] border-white text-center flex flex-col items-center justify-center min-h-[420px] gap-6 overflow-hidden">
                <img src="assets/flower-right-up.jpg" alt="" aria-hidden="true"
                    class="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 object-contain mix-blend-multiply opacity-85 pointer-events-none select-none">
                <img src="assets/flower-ledt-down.jpg" alt="" aria-hidden="true"
                    class="absolute bottom-0 left-0 w-32 sm:w-40 h-32 sm:h-40 object-contain mix-blend-multiply opacity-85 pointer-events-none select-none">
                <!-- Heart icon -->
                <div class="relative z-10 w-16 h-16 rounded-full bg-[#F3ECFF] border border-[#DDD0FA] flex items-center justify-center">
                    <span class="text-3xl">💝</span>
                </div>
                <div class="relative z-10 space-y-3">
                    <h2 class="text-2xl md:text-3xl font-extrabold text-[#1F192E]">
                        תקופת העברת המתנות הסתיימה
                    </h2>
                    <p class="text-[#4E4B66] text-base md:text-lg leading-relaxed max-w-sm mx-auto font-medium">
                        תודה רבה על הרצון לשמח אותנו ולהיות חלק מהשמחה שלנו!
                    </p>
                    <p class="text-[#7A7267] text-sm md:text-base">
                        אפשרות העברת המתנות לאירוע הסתיימה ופרטי הדף הוסרו לשמירה על הפרטיות.
                    </p>
                </div>
                <div class="relative z-10 border-t border-[#D5C3AA]/50 pt-5 w-full space-y-1">
                    ${coupleNames
                        ? `<p class="text-[#9A7142] font-bold">באהבה ובהערכה,</p>
                           <p class="font-serif text-2xl font-bold text-[#1F192E]">${coupleNames} ❤️</p>`
                        : `<p class="text-[#9A7142] font-bold text-lg">באהבה ובהערכה ❤️</p>`
                    }
                    <div class="pt-4 mt-3 border-t border-[#D5C3AA]/35 flex items-center justify-center">
                        <a href="/"
                            class="inline-flex items-center gap-2 hover:opacity-85 transition-opacity">
                            <span class="inline-flex items-center gap-1" dir="ltr">
                                <img src="assets/logo.png" alt="Gift4Event Icon" class="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 select-none">
                                <img src="assets/Gift4Event.PNG" alt="Gift4Event" class="h-6 sm:h-7 w-auto object-contain shrink-0 select-none">
                            </span>
                            <span class="text-[#C69C6D]" aria-hidden="true">·</span>
                            <img src="assets/Slogan.png" alt="עמלות? לא בשמחות!" class="h-[15px] sm:h-[17px] w-auto object-contain shrink-0 select-none">
                        </a>
                    </div>
                </div>
            </div>
        `;
    };

    if (isSlug) {
        // Show loading state
        mainCardContainer.innerHTML = `
            <div class="sample-wedding-card relative rounded-[1.85rem] p-8 md:p-12 border-[3px] border-white text-center flex flex-col items-center justify-center min-h-[400px] overflow-hidden">
                <div class="w-12 h-12 border-4 border-purple-200 border-t-[#6D35E8] rounded-full animate-spin mb-4"></div>
                <p class="text-[#4E4B66] font-semibold text-lg">טוען פרטי אירוע...</p>
            </div>
        `;

        try {
            const response = await (window.__g4eConfigPromise || fetch(`/api/config/${path}`, { cache: 'no-store' }));
            if (!response.ok) {
                if (response.status === 404) {
                    renderExpiredCard('');
                } else {
                    renderError('אירעה שגיאה בטעינת פרטי האירוע. אנא נסו שוב מאוחר יותר.');
                }
                return; // Stop execution on error
            }
            const data = await response.json();

            // ── TIME WINDOW CHECK ──────────────────────────────────────────
            // Server signals expiry by returning isExpired:true
            if (data.isExpired) {
                renderExpiredCard(data.coupleNames || '');
                return; // Stop — do not hydrate the payment form
            }
            // ──────────────────────────────────────────────────────────────

            // Map to expected config structure (default eventType to 'wedding' for backward compatibility)
            config = {
                eventType: data.eventType || 'wedding',
                eventSubType: data.eventSubType || '',
                customEventName: data.customEventName || '',
                coupleNames: data.coupleNames || '',
                name: data.bankDetails?.beneficiaryName || '',
                bank: data.bankDetails?.bankName || '',
                branch: data.bankDetails?.branchNumber || '',
                account: data.bankDetails?.accountNumber || '',
                isMasked: !!data.bankDetails?.isMasked,
                bitLink1: data.bitLinks?.[0] || '',
                bitLink2: data.bitLinks?.[1] || '',
                payboxLink1: data.payboxLinks?.[0] || '',
                payboxLink2: data.payboxLinks?.[1] || '',
                wazeLink: data.wazeLink || '',
                analyticsUrl: data.analyticsUrl || null
            };

            // Restore HTML for hydration
            mainCardContainer.innerHTML = originalHTML;

        } catch (error) {
            console.error('Fetch error:', error);
            renderError('אירעה שגיאה בחיבור לשרת.');
            return;
        }
    } else {
        // Fallback to query parameters for backward compatibility
        const urlParams = new URLSearchParams(window.location.search);
        config = {
            eventType: urlParams.get('eventType') || 'wedding',
            eventSubType: urlParams.get('eventSubType') || '',
            customEventName: urlParams.get('customEventName') || '',
            coupleNames: urlParams.get('coupleNames') || '',
            name: urlParams.get('name') || '',
            bank: urlParams.get('bank') || '',
            branch: urlParams.get('branch') || '',
            account: urlParams.get('account') || '',
            isMasked: false,
            bitLink1: urlParams.get('bitLink1'),
            bitLink2: urlParams.get('bitLink2'),
            bitLinkOld: urlParams.get('bitLink'),
            payboxLink1: urlParams.get('payboxLink1'),
            payboxLink2: urlParams.get('payboxLink2'),
            payboxLinkOld: urlParams.get('payboxLink'),
            wazeLink: urlParams.get('wazeLink'),
            analyticsUrl: urlParams.get('analyticsUrl') || null
        };
    }

    const paramCoupleNames = config.coupleNames || '';
    const titleInfo = (typeof buildEventTitle === 'function')
        ? buildEventTitle({
            eventType: config.eventType,
            eventSubType: config.eventSubType,
            customEventName: config.customEventName,
            coupleNames: paramCoupleNames,
            useSampleFallback: !paramCoupleNames
        })
        : {
            prefix: 'החתונה של',
            names: paramCoupleNames || 'רוני ורן',
            fullTitle: paramCoupleNames ? `החתונה של ${paramCoupleNames}` : 'החתונה של רוני ורן'
        };

    const rawNameParam = config.name;
    const pageTitleSuffix = paramCoupleNames ? titleInfo.fullTitle : (rawNameParam && rawNameParam.trim() !== '' ? rawNameParam : '');
    const pageTitle = pageTitleSuffix
        ? `השתתפות בשמחה | ${pageTitleSuffix}`
        : 'השתתפות בשמחה';

    document.title = pageTitle;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', pageTitle);

    const paramName = config.name || 'לא צוין שם';
    const paramBank = config.bank || 'לא צוין בנק';
    const paramBranch = config.branch || '-';
    const paramAccount = config.account || '-';
    const bitLink1 = config.bitLink1;
    const bitLink2 = config.bitLink2;
    const bitLinkOld = config.bitLinkOld;
    const payboxLink1 = config.payboxLink1;
    const payboxLink2 = config.payboxLink2;
    const payboxLinkOld = config.payboxLinkOld;
    const analyticsUrl = config.analyticsUrl;

    const currentEventId = path && path.trim() !== '' ? path : 'unknown-event';

    function trackEvent(actionType) {
        if (!analyticsUrl) return; // Silent abort if not configured
        fetch(analyticsUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_id: currentEventId,
                action_type: actionType
            }),
            keepalive: true
        }).catch(e => console.error("Telemetry failed silently", e));
    }

    const prefixEl = document.getElementById('event-title-prefix');
    if (prefixEl) {
        prefixEl.textContent = titleInfo.prefix;
    }

    const coupleNamesEl = document.getElementById('couple-names');
    if (coupleNamesEl) {
        coupleNamesEl.textContent = titleInfo.names;
    }

    const footerNamesEl = document.getElementById('footer-couple-names');
    if (footerNamesEl && paramCoupleNames) {
        footerNamesEl.textContent = paramCoupleNames;
    }

    document.getElementById('display-name').textContent = paramName;
    document.getElementById('display-bank').textContent = paramBank;
    document.getElementById('display-branch').textContent = paramBranch;
    document.getElementById('display-account').textContent = paramAccount;

    const validBitLinks = [];
    if (bitLink1) validBitLinks.push(bitLink1);
    if (bitLink2) validBitLinks.push(bitLink2);
    if (!bitLink1 && !bitLink2 && bitLinkOld) validBitLinks.push(bitLinkOld);

    // Modal Logic Variables
    const bitModal = document.getElementById('bit-modal');
    const modalBankBtn = document.getElementById('modal-bank-btn');
    const modalBitProceedBtn = document.getElementById('modal-bit-proceed-btn');
    const bitModalCloseX = document.getElementById('bit-modal-close-x');
    let nextBitLinkToOpen = '';

    const closeBitModal = () => {
        if (bitModal) bitModal.classList.add('hidden');
    };

    const openBitModal = (link) => {
        nextBitLinkToOpen = link;
        if (bitModal) bitModal.classList.remove('hidden');
    };

    if (bitModal) {
        bitModal.addEventListener('click', (e) => {
            if (e.target === bitModal) closeBitModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !bitModal.classList.contains('hidden')) {
                closeBitModal();
            }
        });

        if (bitModalCloseX) {
            bitModalCloseX.addEventListener('click', closeBitModal);
        }

        if (modalBankBtn) {
            modalBankBtn.addEventListener('click', () => {
                trackEvent('bit_bank_click');
                closeBitModal();
                const container = document.getElementById('bank-details');
                if (container) {
                    if (container.classList.contains('hidden')) {
                        container.classList.remove('hidden');
                    }
                    setTimeout(() => {
                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            });
        }

        if (modalBitProceedBtn) {
            modalBitProceedBtn.addEventListener('click', () => {
                trackEvent('bit_click');
                closeBitModal();
                if (nextBitLinkToOpen) {
                    window.open(nextBitLinkToOpen, '_blank');
                }
            });
        }
    }

    if (validBitLinks.length > 0) {
        const bitWrapper = document.getElementById('bit-wrapper');
        const bitBtn = document.getElementById('bit-pay-btn');

        if (bitWrapper && bitBtn) {
            bitWrapper.classList.remove('hidden');
            bitWrapper.classList.add('flex');

            if (validBitLinks.length === 2) {
                let useFirstLink = Math.random() < 0.5;

                bitBtn.addEventListener('click', function () {
                    const linkToOpen = useFirstLink ? validBitLinks[0] : validBitLinks[1];
                    useFirstLink = !useFirstLink;
                    openBitModal(linkToOpen);
                });
            } else {
                bitBtn.addEventListener('click', function () {
                    openBitModal(validBitLinks[0]);
                });
            }
        }
    }

    const validPayboxLinks = [];
    if (payboxLink1) validPayboxLinks.push(payboxLink1);
    if (payboxLink2) validPayboxLinks.push(payboxLink2);
    if (!payboxLink1 && !payboxLink2 && payboxLinkOld) validPayboxLinks.push(payboxLinkOld);

    // PayBox Modal Logic Variables
    const pbModal = document.getElementById('paybox-modal');
    const pbModalBankBtn = document.getElementById('pb-modal-bank-btn');
    const pbModalProceedBtn = document.getElementById('pb-modal-proceed-btn');
    const pbModalCloseX = document.getElementById('paybox-modal-close-x');
    let nextPbLinkToOpen = '';

    const closePbModal = () => {
        if (pbModal) pbModal.classList.add('hidden');
    };

    const openPbModal = (link) => {
        nextPbLinkToOpen = link;
        if (pbModal) pbModal.classList.remove('hidden');
    };

    if (pbModal) {
        pbModal.addEventListener('click', (e) => {
            if (e.target === pbModal) closePbModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !pbModal.classList.contains('hidden')) {
                closePbModal();
            }
        });

        if (pbModalCloseX) {
            pbModalCloseX.addEventListener('click', closePbModal);
        }

        if (pbModalBankBtn) {
            pbModalBankBtn.addEventListener('click', () => {
                trackEvent('paybox_bank_click');
                closePbModal();
                const container = document.getElementById('bank-details');
                if (container) {
                    if (container.classList.contains('hidden')) {
                        container.classList.remove('hidden');
                    }
                    setTimeout(() => {
                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            });
        }

        if (pbModalProceedBtn) {
            pbModalProceedBtn.addEventListener('click', () => {
                trackEvent('paybox_click');
                closePbModal();
                if (nextPbLinkToOpen) {
                    window.open(nextPbLinkToOpen, '_blank');
                }
            });
        }
    }

    if (validPayboxLinks.length > 0) {
        const pbWrapper = document.getElementById('paybox-wrapper');
        const pbBtn = document.getElementById('paybox-pay-btn');

        if (pbWrapper && pbBtn) {
            pbWrapper.classList.remove('hidden');
            pbWrapper.classList.add('flex');

            if (validPayboxLinks.length === 2) {
                let useFirstPbLink = Math.random() < 0.5;

                pbBtn.addEventListener('click', function () {
                    const linkToOpen = useFirstPbLink ? validPayboxLinks[0] : validPayboxLinks[1];
                    useFirstPbLink = !useFirstPbLink;
                    openPbModal(linkToOpen);
                });
            } else {
                pbBtn.addEventListener('click', function () {
                    openPbModal(validPayboxLinks[0]);
                });
            }
        }
    }

    // Waze Button Logic
    const wazeLink = config.wazeLink;
    if (wazeLink) {
        const wazeContainer = document.getElementById('waze-btn-container');
        const topWazeBtn = document.getElementById('top-waze-btn');

        if (wazeContainer && topWazeBtn) {
            wazeContainer.classList.remove('hidden');
            wazeContainer.classList.add('flex');

            topWazeBtn.addEventListener('click', function () {
                trackEvent('waze_click');
                window.open(wazeLink, '_blank');
            });
        }
    }

    // Toggle Bank Details Logic
    document.getElementById('toggle-bank-btn').addEventListener('click', function () {
        const container = document.getElementById('bank-details');
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            setTimeout(() => {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        } else {
            container.classList.add('hidden');
        }
    });

    // Copy Logic for non-sensitive fields
    const copyFields = ['name', 'bank', 'branch'];
    const copiedBadgeHTML = '<span class="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 px-1 whitespace-nowrap"><span>הועתק!</span><svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg></span>';

    copyFields.forEach(field => {
        const btn = document.getElementById(`copy-${field}-btn`);
        const displayEl = document.getElementById(`display-${field}`);

        if (btn && displayEl) {
            btn.addEventListener('click', function () {
                const val = displayEl.textContent;
                if (val && val !== '-' && !val.includes('טוען') && !val.includes('לא צוין')) {
                    if (field === 'bank' || field === 'branch') {
                        trackEvent('bank_copy');
                    }
                    navigator.clipboard.writeText(val).then(() => {
                        if (btn.dataset.copying === 'true') return;
                        btn.dataset.copying = 'true';
                        const originalHTML = btn.innerHTML;
                        btn.innerHTML = copiedBadgeHTML;
                        setTimeout(() => {
                            btn.innerHTML = originalHTML;
                            btn.dataset.copying = 'false';
                        }, 2000);
                    }).catch(() => {
                        console.error('Failed to copy ' + field);
                    });
                }
            });
        }
    });

    // Bank Account Masking & Reveal State Machine
    const accountBtn = document.getElementById('copy-account-btn');
    const displayAccountEl = document.getElementById('display-account');

    let isAccountRevealed = !(config.isMasked || (paramAccount && (paramAccount.includes('•') || paramAccount.includes('*'))));
    let unmaskedAccountNumber = isAccountRevealed ? paramAccount : null;

    const iconEye = '<svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
    const iconSpinner = '<svg class="w-4 h-4 animate-spin pointer-events-none text-[#6D35E8]" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>';
    const iconCopy = '<svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
    const iconCheck = copiedBadgeHTML;
    const iconRetry = '<svg class="w-4 h-4 text-amber-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>';

    function updateAccountBtnUI() {
        if (!accountBtn) return;
        if (isAccountRevealed) {
            accountBtn.innerHTML = iconCopy;
            accountBtn.title = "העתק מספר חשבון";
            accountBtn.setAttribute('aria-label', "העתק מספר חשבון");
            accountBtn.disabled = false;
        } else {
            accountBtn.innerHTML = iconEye;
            accountBtn.title = "הצג מספר חשבון";
            accountBtn.setAttribute('aria-label', "הצג מספר חשבון");
            accountBtn.disabled = false;
        }
    }

    updateAccountBtnUI();

    if (accountBtn && displayAccountEl) {
        accountBtn.addEventListener('click', async function () {
            if (isAccountRevealed) {
                const valToCopy = unmaskedAccountNumber || displayAccountEl.textContent;
                if (valToCopy && valToCopy !== '-' && !valToCopy.includes('•') && !valToCopy.includes('*')) {
                    trackEvent('bank_copy');
                    navigator.clipboard.writeText(valToCopy).then(() => {
                        accountBtn.innerHTML = iconCheck;
                        setTimeout(() => {
                            accountBtn.innerHTML = iconCopy;
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy account number:', err);
                    });
                }
                return;
            }

            accountBtn.disabled = true;
            accountBtn.innerHTML = iconSpinner;
            accountBtn.title = "טוען פרטים...";

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                const eventSlug = currentEventId;
                const res = await fetch(`/api/payment-details/${eventSlug}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    if (res.status === 429) {
                        const rlMsgEl = document.getElementById('account-rate-limit-msg');
                        const rlText = 'נרשמו יותר מדי ניסיונות צפייה מכתובת זו. אנא נסו שוב מאוחר יותר.';
                        if (rlMsgEl) {
                            rlMsgEl.textContent = rlText;
                            rlMsgEl.classList.remove('hidden');
                        }
                        accountBtn.disabled = true;
                        accountBtn.innerHTML = iconEye;
                        accountBtn.classList.add('opacity-40', 'cursor-not-allowed');
                        accountBtn.title = rlText;
                        accountBtn.setAttribute('aria-label', rlText);
                        return;
                    }
                    throw new Error(`Server returned ${res.status}`);
                }

                const details = await res.json();
                if (details && details.accountNumber) {
                    unmaskedAccountNumber = String(details.accountNumber);
                    isAccountRevealed = true;
                    displayAccountEl.textContent = unmaskedAccountNumber;
                    updateAccountBtnUI();
                    trackEvent('bank_reveal');
                } else {
                    throw new Error('Invalid response structure');
                }
            } catch (error) {
                clearTimeout(timeoutId);
                console.error('Failed to reveal bank account:', error);
                accountBtn.disabled = false;
                accountBtn.innerHTML = iconRetry;
                accountBtn.title = "אירעה שגיאה. לחצו לניסיון חוזר";
                accountBtn.setAttribute('aria-label', "אירעה שגיאה. לחצו לניסיון חוזר");
            }
        });
    }
});
