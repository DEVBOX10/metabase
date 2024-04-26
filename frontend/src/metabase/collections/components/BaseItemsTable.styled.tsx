import styled from "@emotion/styled";

import EntityItem from "metabase/components/EntityItem";
import IconButtonWrapper from "metabase/components/IconButtonWrapper";
import Link from "metabase/core/components/Link";
import AdminS from "metabase/css/admin.module.css";
import { color } from "metabase/lib/colors";
import BaseModelDetailLink from "metabase/models/components/ModelDetailLink";
import { breakpointMinLarge } from "metabase/styled-components/theme/media-queries";
import { Icon } from "metabase/ui";
import { breakpoints, type BreakpointName } from "metabase/ui/theme";

import { getCSSForColumnBreakpoints } from "./utils";

export const Table = styled.table<{
  canSelect: boolean;
  columnBreakpoints?: (BreakpointName | undefined)[];
}>`
  background-color: ${color("white")};
  table-layout: fixed;
  border-collapse: unset;
  border-radius: 0.5rem;

  thead {
    th {
      border-top: 1px solid ${color("border")};

      &:first-of-type {
        border-start-start-radius: 8px;
        border-inline-start: 1px solid ${color("border")};
      }

      &:last-child {
        border-start-end-radius: 8px;
        border-inline-end: 1px solid ${color("border")};
      }
    }
  }
  ${props =>
    props.columnBreakpoints?.length &&
    getCSSForColumnBreakpoints(
      breakpoints,
      props.columnBreakpoints,
      "ItemsTableContainer",
    )}
`;

Table.defaultProps = { className: AdminS.ContentTable };

export const ColumnHeader = styled.th`
  padding: 1em 1em 0.75em !important;
  font-weight: bold;
  color: ${color("text-medium")};
`;

export const BulkSelectWrapper = styled(IconButtonWrapper)`
  padding-inline-start: 12px;
  padding-inline-end: 12px;
  width: 3em;
`;

export const LastEditedByCol = styled.col`
  width: 140px;

  ${breakpointMinLarge} {
    width: 240px;
  }
`;

export const ItemCell = styled.td`
  padding: 0.25em 0 0.25em 1em !important;
`;

export const EntityIconCheckBox = styled(EntityItem.IconCheckBox)`
  width: 3em;
  height: 3em;
`;

export const ItemLink = styled(Link)`
  display: flex;
  grid-gap: 0.5rem;
  align-items: center;

  &:hover {
    color: ${color("brand")};
  }
`;

export const ItemNameCell = styled.td`
  padding: 0 !important;

  ${ItemLink} {
    padding: 1em;
  }

  &:hover {
    ${ItemLink} {
      color: ${color("brand")};
    }

    cursor: pointer;
  }
`;

export const SortingIcon = styled(Icon)`
  margin-inline-start: 4px;
`;

export const DescriptionIcon = styled(Icon)`
  color: ${color("text-medium")};
`;

SortingIcon.defaultProps = {
  size: 8,
};

export const ModelDetailLink = styled(BaseModelDetailLink)`
  color: ${color("text-medium")};
  visibility: hidden;
`;

export const SortingControlContainer = styled.div<{
  isActive: boolean;
  isSortable?: boolean;
}>`
  display: flex;
  align-items: center;
  color: ${props => (props.isActive ? color("text-dark") : "")};
  ${props => (props.isSortable ? `cursor: pointer;` : "")}
  user-select: none;

  .Icon {
    visibility: ${props => (props.isActive ? "visible" : "hidden")};
  }

  &:hover {
    color: ${color("text-dark")};

    .Icon {
      visibility: visible;
    }
  }
`;
SortingControlContainer.defaultProps = { isSortable: true };

export const RowActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const TableItemSecondaryField = styled.span`
  font-size: 0.95em;
  color: ${color("text-medium")};
`;

export const TBody = styled.tbody`
  td {
    border: none;
    background-color: transparent;

    border-top: 1px solid ${color("border")};

    &:first-of-type {
      border-inline-start: 1px solid ${color("border")};
    }

    &:last-child {
      border-inline-end: 1px solid ${color("border")};
    }
  }

  tr {
    background-color: transparent;
  }

  tr:last-child {
    td {
      border-bottom: 1px solid ${color("border")};

      &:last-child {
        border-end-end-radius: 8px;
      }

      &:first-of-type {
        border-end-start-radius: 8px;
      }
    }
  }

  tr:hover {
    ${ModelDetailLink} {
      visibility: visible;
    }
  }
`;
