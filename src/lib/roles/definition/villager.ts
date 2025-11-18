import { RoleDefinition } from "../types";

const definition: RoleDefinition = {
    name: "Villager",
    description:
        "You are a villager. You are a normal human that is not a witch or a wizard.",
    script: (gameState) => {
        console.log("Imp script");
    },
    icon: (gameState) => {
        return "👹";
    },
};
export default definition;
