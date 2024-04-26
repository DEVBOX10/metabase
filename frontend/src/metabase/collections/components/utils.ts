import type { BreakpointName } from "metabase/ui/theme";
import type { CollectionItem } from "metabase-types/api";

export const findLastEditedCollectionItem = (
  collectionItems: CollectionItem[],
) => {
  return collectionItems.reduce((latest, item) => {
    if (!latest) {
      return item;
    }

    const latestTimestamp = latest?.["last-edit-info"]?.timestamp;
    const itemTimestamp = item?.["last-edit-info"]?.timestamp;

    if (latestTimestamp && itemTimestamp) {
      return latestTimestamp > itemTimestamp ? latest : item;
    }

    return latest;
  });
};

export const getCSSForColumnBreakpoints = (
  breakpoints: Record<BreakpointName, string>,
  columnBreakpoints: (BreakpointName | undefined)[],
  containerName: string,
) => {
  const ret = Object.entries(breakpoints)
    .map(([breakpointName, value]) => {
      const cssForColumn = columnBreakpoints
        .map((columnBreakpointName: BreakpointName | undefined, index) =>
          columnBreakpointName === breakpointName
            ? `col, th, td {
              &:nth-of-type(${index + 1}) {
                display: none;
              }
            }`
            : "",
        )
        .join("\n")
        .trim();
      return cssForColumn
        ? `@container ${containerName} (max-width: ${value}) { ${cssForColumn} }`
        : "";
    })
    .join("\n");

  return ret;
};
