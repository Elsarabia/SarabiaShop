import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul marino profundo (tinta) y dorado de la playera BR Script
        ink: '#0F1A3A',
        navy: '#0F1A3A',
        navy2: '#1B2750',
        gold: '#B08D4A',
        // Gris de estudio: el mismo fondo de las fotos de producto
        ground: '#E8E8EB',
        studio: '#E7E7EA',
        line: '#D3D4DB',
        line2: '#BFC1CB',
        muted: '#555B6E',
        soft: '#DCDCE2',
        bone: '#F6F6F7',
        ok: '#137A4B',
        bad: '#C4321F',
        info: '#2452C7',
      },
      fontFamily: {
        sans: ['"Archivo Variable"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        up: { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        fade: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        grow: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        pop: { from: { transform: 'scale(.6)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        rise: { from: { transform: 'scaleY(0)' }, to: { transform: 'scaleY(1)' } },
      },
      animation: {
        up: 'up .3s cubic-bezier(.2,.8,.2,1) both',
        fade: 'fade .22s ease both',
        grow: 'grow .9s cubic-bezier(.2,.8,.2,1) both',
        pop: 'pop .45s cubic-bezier(.2,.9,.3,1.3) both',
        rise: 'rise .5s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
