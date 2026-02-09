import { useState } from "react";
import { getAllRoles } from "../../lib/roles";
import { useI18n } from "../../lib/i18n";
import { Icon, Button } from "../atoms";
import { IconName } from "../atoms/icon";
import { NarratorSetupLayout } from "../layouts";
import { cn } from "../../lib/utils";

type NumberProps = {
    type: "number";
    roleIcon: IconName;
    roleName: string;
    playerName: string;
    numberRange: { min: number; max: number };
    onComplete: (result: number) => void;
};

type BooleanProps = {
    type: "boolean";
    roleIcon: IconName;
    roleName: string;
    playerName: string;
    trueLabel: string;
    falseLabel: string;
    onComplete: (result: boolean) => void;
};

type RoleProps = {
    type: "role";
    roleIcon: IconName;
    roleName: string;
    playerName: string;
    onComplete: (result: string) => void;
};

type Props = NumberProps | BooleanProps | RoleProps;

/**
 * A shared narrator-only component for configuring what a malfunctioning
 * player should see. Used when a player is poisoned/drunk.
 *
 * Variants:
 * - "number": Number picker (Chef, Empath)
 * - "boolean": Yes/No toggle (Fortune Teller)
 * - "role": Role picker from full role list (Undertaker, Ravenkeeper)
 */
export function MalfunctionConfigStep(props: Props) {
    const { t } = useI18n();

    return (
        <NarratorSetupLayout
            icon={props.roleIcon}
            roleName={props.roleName}
            playerName={props.playerName}
        >
            {/* Malfunction warning banner */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-900/20 p-3 mb-4">
                <div className="flex items-center gap-2">
                    <Icon name="alertTriangle" size="md" className="text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-300 font-medium">
                        {t.game.malfunctionWarning}
                    </p>
                </div>
                <p className="text-xs text-amber-400/70 mt-1 ml-7">
                    {t.game.playerIsMalfunctioning}
                </p>
            </div>

            {props.type === "number" && <NumberPicker {...props} />}
            {props.type === "boolean" && <BooleanPicker {...props} />}
            {props.type === "role" && <RolePicker {...props} />}
        </NarratorSetupLayout>
    );
}

// ============================================================================
// NUMBER PICKER
// ============================================================================

function NumberPicker({ numberRange, onComplete }: NumberProps) {
    const { t } = useI18n();
    const [value, setValue] = useState(numberRange.min);

    return (
        <div>
            <h3 className="text-lg font-semibold text-amber-200 text-center mb-4">
                {t.game.chooseFalseNumber}
            </h3>

            <div className="flex items-center justify-center gap-6 mb-6">
                <button
                    onClick={() => setValue(Math.max(numberRange.min, value - 1))}
                    disabled={value <= numberRange.min}
                    className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-parchment-200 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <Icon name="minus" size="md" />
                </button>

                <div className="text-5xl font-tarot text-amber-300 w-20 text-center">
                    {value}
                </div>

                <button
                    onClick={() => setValue(Math.min(numberRange.max, value + 1))}
                    disabled={value >= numberRange.max}
                    className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-parchment-200 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <Icon name="plus" size="md" />
                </button>
            </div>

            <Button
                onClick={() => onComplete(value)}
                fullWidth
                size="lg"
                variant="night"
            >
                <Icon name="check" size="md" className="mr-2" />
                {t.common.confirm}
            </Button>
        </div>
    );
}

// ============================================================================
// BOOLEAN PICKER
// ============================================================================

function BooleanPicker({ trueLabel, falseLabel, onComplete }: BooleanProps) {
    const { t } = useI18n();
    const [selected, setSelected] = useState<boolean | null>(null);

    return (
        <div>
            <h3 className="text-lg font-semibold text-amber-200 text-center mb-4">
                {t.game.chooseFalseResult}
            </h3>

            <div className="space-y-2 mb-6">
                <button
                    onClick={() => setSelected(true)}
                    className={cn(
                        "w-full p-4 rounded-lg border text-sm font-medium transition-colors text-left",
                        selected === true
                            ? "bg-emerald-900/40 border-emerald-500/50 text-emerald-300"
                            : "bg-white/5 border-white/10 text-parchment-400 hover:bg-white/10",
                    )}
                >
                    <Icon name="check" size="sm" className="inline mr-2" />
                    {trueLabel}
                </button>
                <button
                    onClick={() => setSelected(false)}
                    className={cn(
                        "w-full p-4 rounded-lg border text-sm font-medium transition-colors text-left",
                        selected === false
                            ? "bg-red-900/40 border-red-500/50 text-red-300"
                            : "bg-white/5 border-white/10 text-parchment-400 hover:bg-white/10",
                    )}
                >
                    <Icon name="x" size="sm" className="inline mr-2" />
                    {falseLabel}
                </button>
            </div>

            <Button
                onClick={() => selected !== null && onComplete(selected)}
                disabled={selected === null}
                fullWidth
                size="lg"
                variant="night"
            >
                <Icon name="check" size="md" className="mr-2" />
                {t.common.confirm}
            </Button>
        </div>
    );
}

// ============================================================================
// ROLE PICKER
// ============================================================================

function RolePicker({ onComplete }: RoleProps) {
    const { t } = useI18n();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const allRoles = getAllRoles();

    const getRoleName = (roleId: string) => {
        const key = roleId as keyof typeof t.roles;
        return t.roles[key]?.name ?? roleId;
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-amber-200 text-center mb-4">
                {t.game.chooseFalseRole}
            </h3>

            <div className="space-y-1 mb-6 max-h-64 overflow-y-auto">
                {allRoles.map((role) => (
                    <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                            "w-full p-3 rounded-lg border flex items-center gap-3 transition-colors text-left",
                            selectedRole === role.id
                                ? "bg-amber-900/30 border-amber-500/50"
                                : "bg-white/5 border-white/10 hover:bg-white/10",
                        )}
                    >
                        <Icon
                            name={role.icon}
                            size="md"
                            className={
                                selectedRole === role.id
                                    ? "text-amber-300"
                                    : "text-parchment-400"
                            }
                        />
                        <span
                            className={cn(
                                "text-sm font-medium",
                                selectedRole === role.id
                                    ? "text-amber-200"
                                    : "text-parchment-300",
                            )}
                        >
                            {getRoleName(role.id)}
                        </span>
                    </button>
                ))}
            </div>

            <Button
                onClick={() => selectedRole && onComplete(selectedRole)}
                disabled={!selectedRole}
                fullWidth
                size="lg"
                variant="night"
            >
                <Icon name="check" size="md" className="mr-2" />
                {t.common.confirm}
            </Button>
        </div>
    );
}
