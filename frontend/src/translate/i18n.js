import i18n from "i18next";
import { messages } from "./languages";

// Função para detectar o idioma do navegador
const detectBrowserLanguage = () => {
	const browserLang = navigator.language || navigator.userLanguage;
	
	// Mapear códigos de idioma do navegador para os suportados
	if (browserLang.startsWith('pt')) return 'pt';
	if (browserLang.startsWith('es')) return 'es';
	if (browserLang.startsWith('en')) return 'en';
	
	// Fallback para português se não encontrar correspondência
	return 'pt';
};

const savedLanguage = localStorage.getItem('i18nextLng') || detectBrowserLanguage();

i18n.init({
	debug: true,
	defaultNS: ["translations"],
	fallbackLng: "pt",
	ns: ["translations"],
	resources: messages,
	lng: savedLanguage,
});

// Salvar o idioma detectado no localStorage se não existir
if (!localStorage.getItem('i18nextLng')) {
	localStorage.setItem('i18nextLng', savedLanguage);
}

export const changeLanguage = (language) => {
	i18n.changeLanguage(language);
	localStorage.setItem('i18nextLng', language);
};

export { i18n };