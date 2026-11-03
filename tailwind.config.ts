import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16181B',
        ground: '#F4F4F1',
        line: '#E4E4DF',
        line2: '#D3D3CC',
        muted: '#5F646C',
        soft: '#EEEEEA',
        ok: '#137A4B',
        bad: '#C4321F',
        info: '#2452C7',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        up: { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        fade: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        grow: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        pop: { from: { transform: 'scale(.6)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
      },
      animation: {
        up: 'up .3s cubic-bezier(.2,.8,.2,1) both',
        fade: 'fade .22s ease both',
        grow: 'grow .9s cubic-bezier(.2,.8,.2,1) both',
        pop: 'pop .45s cubic-bezier(.2,.9,.3,1.3) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
