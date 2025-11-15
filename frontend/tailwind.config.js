/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#0d0d0f', card: '#1c1c24' },  // พื้นหลังหลักและพื้นหลังกล่อง
        text:    { light: '#f5f5f5', muted: '#a1a1aa' },   // ตัวอักษรหลักและรอง
        primary: { DEFAULT: '#6366f1', dark: '#4f46e5' },  // สีหลัก (indigo)
        border:  { DEFAULT: '#3f3f46' }                    // สีเส้นแบ่ง
      }
    },
  },
  plugins: [],
};
