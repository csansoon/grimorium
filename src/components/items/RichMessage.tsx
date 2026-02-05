import { RichMessage as RichMessageType, GameState, getPlayer } from "../../lib/types";
import { getRole } from "../../lib/roles";
import { EffectId } from "../../lib/effects";
import { useI18n, interpolate, Translations } from "../../lib/i18n";
import { Badge, Icon } from "../atoms";

type Props = {
    message: RichMessageType;
    state: GameState;
};

// Helper to get a nested translation value by dot-notation key
function getTranslation(t: Translations, key: string): string | undefined {
    const parts = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = t;
    for (const part of parts) {
        if (value && typeof value === "object" && part in value) {
            value = value[part];
        } else {
            return undefined;
        }
    }
    return typeof value === "string" ? value : undefined;
}

export function RichMessage({ message, state }: Props) {
    const { t } = useI18n();

    const getRoleName = (roleId: string) => {
        const key = roleId as keyof typeof t.roles;
        return t.roles[key]?.name ?? roleId;
    };

    const getEffectName = (effectType: string) => {
        const key = effectType as EffectId;
        return t.effects[key]?.name ?? effectType;
    };

    return (
        <span className="inline-flex flex-wrap items-center gap-1">
            {message.map((part, index) => {
                switch (part.type) {
                    case "text":
                        return <span key={index}>{part.content}</span>;

                    case "i18n": {
                        const template = getTranslation(t, part.key);
                        if (!template) return <span key={index}>[{part.key}]</span>;
                        const translated = part.params 
                            ? interpolate(template, part.params as Record<string, string | number>)
                            : template;
                        return <span key={index}>{translated}</span>;
                    }

                    case "player": {
                        const player = getPlayer(state, part.playerId);
                        if (!player) return <span key={index}>[Unknown Player]</span>;
                        return (
                            <Badge key={index} variant="player">
                                {player.name}
                            </Badge>
                        );
                    }

                    case "role": {
                        const role = getRole(part.roleId);
                        if (!role) return <span key={index}>[Unknown Role]</span>;
                        const teamVariant = role.team as "townsfolk" | "outsider" | "minion" | "demon";
                        return (
                            <Badge key={index} variant={teamVariant} className="inline-flex items-center gap-1">
                                <Icon name={role.icon} size="xs" /> {getRoleName(part.roleId)}
                            </Badge>
                        );
                    }

                    case "effect": {
                        return (
                            <Badge key={index} variant="effect">
                                {getEffectName(part.effectType)}
                            </Badge>
                        );
                    }

                    default:
                        return null;
                }
            })}
        </span>
    );
}
