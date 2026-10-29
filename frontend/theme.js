// Shared Tailwind CSS Theme Configuration & Central Event Utilities for Gift4Event
tailwind.config = {
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#6D35E8',
                    deep: '#4F2EB8',
                    lavender: '#F4EFFF',
                    border: '#DED3FA',
                    bg: '#F6F3FF',
                    text: '#252336',
                    muted: '#626075',
                    success: '#138568'
                },
                wedding: {
                    gold: '#D4AF37',
                    light: '#FAF9F6',
                    rose: '#F3E5F5',
                    champagne: '#F7E7CE',
                    dark: '#2C3E50'
                }
            },
            fontFamily: {
                sans: ['Assistant', 'sans-serif'],
                serif: ['Frank Ruhl Libre', 'serif'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        }
    }
};

// ── Central Event Types & Title Builder (Shared across Form, Gift Page & PDF) ──
const EVENT_TYPES = Object.freeze({
    WEDDING: 'wedding',
    BRIT_BRITA: 'brit_brita',
    BAR_BAT_MITZVAH: 'bar_bat_mitzvah',
    BIRTHDAY: 'birthday',
    HENNA: 'henna',
    OTHER: 'other'
});

const EVENT_SUBTYPES = Object.freeze({
    BRIT_MILAH: 'brit_milah',
    BRITA: 'brita',
    BAR_MITZVAH: 'bar_mitzvah',
    BAT_MITZVAH: 'bat_mitzvah'
});

const EVENT_TITLE_CONFIG = Object.freeze({
    wedding: {
        prefix: 'החתונה של',
        sampleNames: 'רוני ורן',
        inputPlaceholder: 'לדוגמה: רוני ורן'
    },
    brit_milah: {
        prefix: 'הברית של',
        sampleNames: 'יונתן',
        inputPlaceholder: 'לדוגמה: יונתן'
    },
    brita: {
        prefix: 'הבריתה של',
        sampleNames: 'נועה',
        inputPlaceholder: 'לדוגמה: נועה'
    },
    bar_mitzvah: {
        prefix: 'בר המצווה של',
        sampleNames: 'דניאל',
        inputPlaceholder: 'לדוגמה: דניאל'
    },
    bat_mitzvah: {
        prefix: 'בת המצווה של',
        sampleNames: 'מאיה',
        inputPlaceholder: 'לדוגמה: מאיה'
    },
    birthday: {
        prefix: 'יום ההולדת של',
        sampleNames: 'רוני',
        inputPlaceholder: 'לדוגמה: רוני'
    },
    henna: {
        prefix: 'החינה של',
        sampleNames: 'רוני ורן',
        inputPlaceholder: 'לדוגמה: רוני ורן'
    },
    other: {
        prefix: '',
        sampleNames: 'רוני ורן',
        sampleCustomEventName: 'חנוכת בית',
        inputPlaceholder: 'לדוגמה: רוני ורן'
    }
});

/**
 * Resolves the effective event key ('wedding', 'brit_milah', 'brita', 'bar_mitzvah', 'bat_mitzvah', 'birthday', 'henna', 'other')
 * with full backward compatibility (defaults to 'wedding' when missing or unrecognized).
 */
function resolveEffectiveEventType(eventType, eventSubType) {
    const rawType = String(eventType || '').trim().toLowerCase();
    const rawSub = String(eventSubType || '').trim().toLowerCase();

    if (!rawType || rawType === EVENT_TYPES.WEDDING) {
        return 'wedding';
    }
    if (rawType === EVENT_TYPES.BRIT_BRITA) {
        return rawSub === EVENT_SUBTYPES.BRITA ? 'brita' : 'brit_milah';
    }
    if (rawType === EVENT_TYPES.BAR_BAT_MITZVAH) {
        return rawSub === EVENT_SUBTYPES.BAT_MITZVAH ? 'bat_mitzvah' : 'bar_mitzvah';
    }
    if (rawType === EVENT_SUBTYPES.BRIT_MILAH || rawType === EVENT_SUBTYPES.BRITA ||
        rawType === EVENT_SUBTYPES.BAR_MITZVAH || rawType === EVENT_SUBTYPES.BAT_MITZVAH) {
        return rawType;
    }
    if (rawType === EVENT_TYPES.BIRTHDAY || rawType === EVENT_TYPES.HENNA || rawType === EVENT_TYPES.OTHER) {
        return rawType;
    }
    return 'wedding';
}

/**
 * Single source of truth for building event titles across the entire application:
 * - Form live preview (index.html / app.js)
 * - Personal gift page (payment.html / payment.js)
 * - Printable A4 PDF sign (pdf-sign.js)
 *
 * @param {Object} [options={}]
 * @param {string} [options.eventType='wedding']
 * @param {string} [options.eventSubType='']
 * @param {string} [options.customEventName='']
 * @param {string} [options.coupleNames='']
 * @param {boolean} [options.useSampleFallback=false]
 * @returns {{
 *   effectiveType: string,
 *   prefix: string,
 *   names: string,
 *   fullTitle: string,
 *   sampleNames: string,
 *   inputPlaceholder: string
 * }}
 */
function buildEventTitle(options = {}) {
    const effectiveType = resolveEffectiveEventType(options.eventType, options.eventSubType);
    const meta = EVENT_TITLE_CONFIG[effectiveType] || EVENT_TITLE_CONFIG.wedding;
    const useSample = Boolean(options.useSampleFallback);

    const rawNames = String(options.coupleNames || '').trim();
    const names = rawNames || (useSample ? meta.sampleNames : '');

    if (effectiveType === 'other') {
        const rawCustomName = String(options.customEventName || '').trim();
        const customTitle = rawCustomName || (useSample ? meta.sampleCustomEventName : 'האירוע');
        const prefix = customTitle.endsWith(' של') ? customTitle : `${customTitle} של`;
        const fullTitle = names ? `${prefix} ${names}` : prefix;
        return {
            effectiveType,
            prefix: prefix,
            names: names,
            fullTitle: fullTitle,
            sampleNames: meta.sampleNames,
            inputPlaceholder: meta.inputPlaceholder
        };
    }

    const prefix = meta.prefix;
    const fullTitle = names ? `${prefix} ${names}` : prefix;

    return {
        effectiveType,
        prefix,
        names,
        fullTitle,
        sampleNames: meta.sampleNames,
        inputPlaceholder: meta.inputPlaceholder
    };
}

/**
 * Convenience wrapper returning the formatted single-line title string.
 */
function formatEventTitle(options = {}) {
    return buildEventTitle(options).fullTitle;
}

window.EVENT_TYPES = EVENT_TYPES;
window.EVENT_SUBTYPES = EVENT_SUBTYPES;
window.resolveEffectiveEventType = resolveEffectiveEventType;
window.buildEventTitle = buildEventTitle;
window.formatEventTitle = formatEventTitle;
