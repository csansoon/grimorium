import { Icon } from "./icon";
import { cn } from "../../lib/utils";

type BackButtonProps = {
    onClick: () => void;
    label?: string;
};

export function BackButton({ onClick, label }: BackButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 -ml-2 text-parchment-400 hover:text-parchment-100 transition-colors",
                label && "flex items-center gap-1",
            )}
        >
            <Icon name="arrowLeft" size="md" />
            {label && <span className="text-xs">{label}</span>}
        </button>
    );
}
