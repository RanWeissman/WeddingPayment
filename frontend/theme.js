// Shared Tailwind CSS Theme Configuration for Gift4Event
tailwind.config = {
    theme: {
        extend: {
            colors: {
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
