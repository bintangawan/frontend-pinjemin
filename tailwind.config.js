/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./user/**/*.{html,js}'], // sesuaikan dengan struktur project-mu
    theme: {
        extend: {
            fontFamily: {
                sans: ['Roboto', 'Arial', 'sans-serif'],
                montserrat: ['Montserrat', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
                opensan: ['OpenSans', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
