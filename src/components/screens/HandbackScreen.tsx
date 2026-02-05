import { useI18n } from "../../lib/i18n";
import { Button, Icon } from "../atoms";

type Props = {
    onContinue: () => void;
};

export function HandbackScreen({ onContinue }: Props) {
    const { t } = useI18n();

    return (
        <div className="min-h-screen bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-sm">
                {/* Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-mystic-gold/10 border-2 border-mystic-gold/30 flex items-center justify-center">
                        <Icon name="eye" size="4xl" className="text-mystic-gold" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="font-tarot text-2xl text-parchment-100 tracking-wider uppercase mb-4">
                    {t.game.handbackToNarrator}
                </h1>

                {/* Description */}
                <p className="text-parchment-400 text-sm mb-10">
                    {t.game.handbackDescription}
                </p>

                {/* Divider */}
                <div className="divider-mystic mb-10">
                    <Icon name="sparkles" size="sm" className="text-mystic-gold/40" />
                </div>

                {/* Button */}
                <Button
                    onClick={onContinue}
                    size="lg"
                    fullWidth
                    className="bg-gradient-to-r from-mystic-gold to-mystic-bronze text-grimoire-dark font-tarot uppercase tracking-wider"
                >
                    <Icon name="check" size="md" className="mr-2" />
                    {t.game.narratorReady}
                </Button>
            </div>
        </div>
    );
}
