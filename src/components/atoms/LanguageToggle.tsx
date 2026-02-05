import { useI18n, Language } from "../../lib/i18n";
import { Icon } from "./icon";

const LANGUAGE_LABELS: Record<Language, string> = {
    en: "EN",
    es: "ES",
};

type Props = {
    variant?: "button" | "floating";
    className?: string;
};

export function LanguageToggle({ variant = "button", className = "" }: Props) {
    const { language, setLanguage } = useI18n();

    const toggleLanguage = () => {
        setLanguage(language === "en" ? "es" : "en");
    };

    if (variant === "floating") {
        return (
            <button
                onClick={toggleLanguage}
                className={`w-12 h-12 rounded-full bg-grimoire-dark/90 border border-mystic-gold/30 text-mystic-gold flex items-center justify-center shadow-lg hover:bg-grimoire-dark hover:border-mystic-gold/50 transition-colors text-sm font-medium ${className}`}
                title={LANGUAGE_LABELS[language]}
            >
                <Icon name="globe" size="md" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-mystic-gold/30 text-mystic-gold/70 hover:text-mystic-gold hover:border-mystic-gold/50 transition-colors text-sm ${className}`}
        >
            <Icon name="globe" size="sm" />
            {LANGUAGE_LABELS[language]}
        </button>
    );
}
