import { CoffeesPermission } from "src/coffees/entities/coffees.permission";

export const Permission = {
  ...CoffeesPermission,
};

export type PermissionType = CoffeesPermission; // | ...other permission enums