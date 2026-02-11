import { PlayerState, EffectInstance, hasEffect } from "../../lib/types";
import { getRole } from "../../lib/roles";
import { getTeam } from "../../lib/teams";
import { Icon } from "../atoms";
import { IconName } from "../atoms/icon";
import { cn } from "../../lib/utils";

// =============================================================================
// Effect Visibility — effects with dedicated custom UI are hidden from badges
// =============================================================================

/** Effects rendered via custom UI instead of generic effect badges. */
const CUSTOM_UI_EFFECT_TYPES = new Set<string>(["dead", "drunk"]);

/** Filter out effects that have dedicated custom UI (dead, drunk). */
export function filterVisibleEffects(effects: EffectInstance[]): EffectInstance[] {
    return effects.filter((e) => !CUSTOM_UI_EFFECT_TYPES.has(e.type));
}

// =============================================================================
// PlayerRoleIcon — shared icon medallion with dead / drunk status overlays
// =============================================================================

type Size = "sm" | "md" | "lg";

const sizeConfig: Record<
    Size,
    {
        circle: string;
        border: string;
        iconSize: "sm" | "md" | "2xl";
        subCircle: string;
        subIconSize: "xs" | "sm";
        subStrokeWidth: number;
    }
> = {
    sm: {
        circle: "w-8 h-8",
        border: "border",
        iconSize: "sm",
        subCircle: "w-[14px] h-[14px]",
        subIconSize: "xs",
        subStrokeWidth: 2.5,
    },
    md: {
        circle: "w-10 h-10",
        border: "border",
        iconSize: "md",
        subCircle: "w-[18px] h-[18px]",
        subIconSize: "xs",
        subStrokeWidth: 2,
    },
    lg: {
        circle: "w-16 h-16",
        border: "border-2",
        iconSize: "2xl",
        subCircle: "w-6 h-6",
        subIconSize: "sm",
        subStrokeWidth: 2,
    },
};

type PlayerRoleIconProps = {
    player: PlayerState;
    /** sm = 32px, md = 40px, lg = 64px */
    size?: Size;
    /**
     * Override circle bg + border classes for the normal state (not dead/drunk).
     * If omitted, uses team-based defaults.
     */
    circleClassName?: string;
    /**
     * Override icon color class for the normal state (not dead/drunk).
     * If omitted, uses `team.colors.text`.
     */
    iconClassName?: string;
};

export function PlayerRoleIcon({
    player,
    size = "md",
    circleClassName,
    iconClassName,
}: PlayerRoleIconProps) {
    const role = getRole(player.roleId);
    const team = role ? getTeam(role.team) : null;
    const isDead = hasEffect(player, "dead");
    const isDrunk = hasEffect(player, "drunk");

    const cfg = sizeConfig[size];

    // --- Circle background ---
    const circleBg = isDead
        ? "bg-parchment-500/10 border-parchment-500/30"
        : isDrunk
            ? "bg-amber-900/20 border-amber-500/30"
            : circleClassName ??
              (team?.isEvil
                  ? "bg-red-900/30 border-red-600/30"
                  : "bg-mystic-gold/10 border-mystic-gold/20");

    // --- Icon props ---
    let iconName: IconName = role?.icon ?? "user";
    let iconColor = iconClassName ?? team?.colors.text ?? "text-parchment-400";

    if (isDead) {
        iconName = "skull";
        iconColor = "text-parchment-500";
    } else if (isDrunk) {
        iconName = "beer";
        iconColor = "text-amber-400";
    }

    return (
        <div className="relative flex-shrink-0">
            <div
                className={cn(
                    "rounded-full flex items-center justify-center",
                    cfg.circle,
                    cfg.border,
                    circleBg,
                )}
            >
                <Icon name={iconName} size={cfg.iconSize} className={iconColor} />
            </div>

            {/* Sub-icon: believed role when drunk (hidden when dead) */}
            {isDrunk && !isDead && role && (
                <div
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center border",
                        cfg.subCircle,
                        team?.isEvil
                            ? "bg-red-950 border-red-600/50"
                            : "bg-slate-900 border-mystic-gold/40",
                    )}
                >
                    <Icon
                        name={role.icon}
                        size={cfg.subIconSize}
                        className={team?.colors.text ?? "text-parchment-400"}
                        strokeWidth={cfg.subStrokeWidth}
                    />
                </div>
            )}
        </div>
    );
}
