import { Icon } from "../atoms";
import { IconName } from "../atoms/icon";
import { cn } from "../../lib/utils";

type MysticDividerProps = {
    icon?: IconName;
    iconClassName?: string;
    className?: string;
};

export function MysticDivider({
    icon = "sparkles",
    iconClassName = "text-mystic-gold/40",
    className,
}: MysticDividerProps) {
    return (
        <div className={cn("flex items-center gap-4 my-4", className)}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mystic-gold/30 to-transparent" />
            <Icon name={icon} size="sm" className={iconClassName} />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mystic-gold/30 to-transparent" />
        </div>
    );
}
