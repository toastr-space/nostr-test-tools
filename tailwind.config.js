export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [require('daisyui'), require('@tailwindcss/typography')],
	daisyui: {
		themes: ['light', 'dark', 'synthwave', 'dracula', 'cmyk', 'bumblebee']
	}
};
