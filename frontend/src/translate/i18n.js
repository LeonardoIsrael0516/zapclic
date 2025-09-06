import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { messages } from "./languages";

// Detecta o idioma do navegador automaticamente
const detectionOptions = {
	order: ['navigator', 'localStorage', 'htmlTag', 'path', 'subdomain'],
	caches: ['localStorage'],
	lookupLocalStorage: 'i18nextLng'
};

i18n
	.use(LanguageDetector)
	.init({
		debug: true,
		defaultNS: ["translations"],
		fallbackLng: "pt",
		ns: ["translations"],
		resources: messages,
		detection: detectionOptions,
		supportedLngs: ['pt', 'en', 'es', 'pt-BR', 'tr'], // idiomas suportados
		nonExplicitSupportedLngs: true
	});

export const changeLanguage = (language) => {
	i18n.changeLanguage(language);
	localStorage.setItem('i18nextLng', language);
};

export { i18n };