import type {ListProps} from "react-virtualized";

// react-virtualized defaults these grid-only attributes when they are undefined.
// Null prevents those defaults and React omits the attributes from the DOM.
export const listAccessibilityProps = {
    role: "list",
    containerRole: "presentation",
    "aria-label": null,
    "aria-readonly": null,
} as unknown as Pick<ListProps, "role" | "containerRole" | "aria-label" | "aria-readonly">;
