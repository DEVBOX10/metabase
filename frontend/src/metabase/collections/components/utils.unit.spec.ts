import type { BreakpointName } from "metabase/ui/theme";

import { getCSSForColumnBreakpoints } from "./utils";

const normalizeWhitespace = (str: string) => str.replace(/\s+/g, " ").trim();

describe("getCSSForColumnBreakpoints", () => {
  it("should generate correct CSS rules for given column breakpoint names", () => {
    const breakpoints = {
      xs: "8rem",
      sm: "10rem",
      md: "12rem",
      lg: "14rem",
      xl: "16rem",
    };
    const columnBreakpoints: (BreakpointName | undefined)[] = [
      undefined,
      "xs",
      "md",
      "md",
    ];
    const containerName = "Container";

    const result = getCSSForColumnBreakpoints(
      breakpoints,
      columnBreakpoints,
      containerName,
    );

    const expected = `
        @container Container (max-width: 8rem) {
          col,
          th,
          td {
            &:nth-of-type(2) {
              display: none;
            }
          }
        }
        @container Container (max-width: 12rem) {
          col,
          th,
          td {
            &:nth-of-type(3) {
              display: none;
            }
          }
          col,
          th,
          td {
            &:nth-of-type(4) {
              display: none;
            }
          }
        }
      `;
    expect(normalizeWhitespace(result)).toEqual(normalizeWhitespace(expected));
  });
});
