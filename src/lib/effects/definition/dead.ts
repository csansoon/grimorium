import { RoleDefinition } from "../types";

const definition: RoleDefinition = {
    name: "Imp",
    description:
        "You are an imp. You are a minor demon that is sent to the human world to cause trouble.",
    script: (gameState) => {
        console.log("Imp script");
    },
    icon: (gameState) => {
        return "👹";
    },
};
export default definition;
