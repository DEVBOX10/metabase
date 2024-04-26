import { merge } from "icepick";
import {
  cloneElement,
  isValidElement,
  type Attributes,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { t } from "ttag";
import _ from "underscore";

import CheckBox from "metabase/core/components/CheckBox";
import type { breakpoints } from "metabase/ui/theme";
import type Database from "metabase-lib/v1/metadata/Database";
import type { Bookmark, Collection, CollectionItem } from "metabase-types/api";

import type {
  CreateBookmark,
  DeleteBookmark,
  OnCopy,
  OnMove,
  OnToggleSelectedWithItem,
} from "../types";

import {
  BulkSelectWrapper,
  ColumnHeader,
  LastEditedByCol,
  SortingControlContainer,
  SortingIcon,
  Table,
  TBody,
} from "./BaseItemsTable.styled";
import BaseTableItem, { type BaseTableItemProps } from "./BaseTableItem";

export type SortingOptions = {
  sort_column: string;
  sort_direction: "asc" | "desc";
};

type SortableColumnHeaderProps = {
  name: string;
  sortingOptions: SortingOptions;
  onSortingOptionsChange: (newSortingOptions: SortingOptions) => void;
  isSortable?: boolean;
} & PropsWithChildren<Partial<HTMLAttributes<HTMLDivElement>>>;

export enum Sort {
  Asc = "asc",
  Desc = "desc",
}

export const SortableColumnHeader = ({
  name,
  sortingOptions,
  onSortingOptionsChange,
  isSortable = true,
  children,
  ...props
}: SortableColumnHeaderProps) => {
  const isSortingThisColumn = sortingOptions.sort_column === name;
  const direction = isSortingThisColumn
    ? sortingOptions.sort_direction
    : Sort.Desc;

  const onSortingControlClick = () => {
    const nextDirection = direction === Sort.Asc ? Sort.Desc : Sort.Asc;
    onSortingOptionsChange({
      sort_column: name,
      sort_direction: nextDirection,
    });
  };

  return (
    <ColumnHeader>
      <SortingControlContainer
        {...props}
        isActive={isSortingThisColumn}
        onClick={onSortingControlClick}
        role="button"
        isSortable={isSortable}
      >
        {children}
        {isSortable && (
          <SortingIcon
            name={direction === Sort.Asc ? "chevronup" : "chevrondown"}
          />
        )}
      </SortingControlContainer>
    </ColumnHeader>
  );
};
type Breakpoint = keyof typeof breakpoints;

export type BaseItemsTableColumn = {
  col?: ReactNode;
  header?: ReactNode;
  show?: boolean;
  index?: number;
  /** Below this container width, the column will be hidden */
  breakpoint?: Breakpoint;
};

export enum ColumnId {
  Select = "select",
  Model = "model",
  Name = "name",
  LastEditedBy = "lastEditedBy",
  LastEditedAt = "lastEditedAt",
  ActionMenu = "actionMenu",
  Description = "description",
  Collection = "collection",
  RightEdge = "rightEdge",
}
type BaseItemsTableColumnMap = Record<ColumnId, BaseItemsTableColumn>;

export interface BaseItemsTableProps {
  items: CollectionItem[];
  collection?: Collection;
  databases?: Database[];
  bookmarks?: Bookmark[];
  createBookmark?: CreateBookmark;
  deleteBookmark?: DeleteBookmark;
  selectedItems?: CollectionItem[];
  hasUnselected?: boolean;
  isPinned?: boolean;
  ItemComponent?: (props: ItemRendererProps) => JSX.Element;
  sortingOptions: SortingOptions;
  isSortable?: boolean;
  onSortingOptionsChange: (newSortingOptions: SortingOptions) => void;
  onToggleSelected?: OnToggleSelectedWithItem;
  onSelectAll?: () => void;
  onSelectNone?: () => void;
  onCopy?: OnCopy;
  onMove?: OnMove;
  onDrop?: () => void;
  getIsSelected?: (item: any) => boolean;
  /** Used for dragging */
  headless?: boolean;
  customColumns?: Partial<BaseItemsTableColumnMap>;
}

export type ItemRendererProps = {
  item: CollectionItem;
} & BaseTableItemProps;

const withProps = (node: ReactNode, props: Attributes) =>
  isValidElement(node) ? cloneElement(node, props) : node;

const DefaultItemComponent = ({ item, ...props }: ItemRendererProps) => {
  return (
    <BaseTableItem key={`${item.model}-${item.id}`} item={item} {...props} />
  );
};

const getDefaultColumns = (
  props: Pick<
    BaseItemsTableProps,
    | "sortingOptions"
    | "onSortingOptionsChange"
    | "selectedItems"
    | "hasUnselected"
    | "onSelectAll"
    | "onSelectNone"
    | "isSortable"
  >,
) => {
  const defaultColumns: Partial<BaseItemsTableColumnMap> = {};
  const {
    sortingOptions,
    onSortingOptionsChange,
    selectedItems,
    hasUnselected,
    onSelectAll,
    onSelectNone,
    isSortable: isSortable,
  } = props;
  const sortableColumnHeaderProps = {
    sortingOptions,
    onSortingOptionsChange,
    isSortable,
  };
  defaultColumns.select = {
    index: 0,
    col: <col style={{ width: "70px" }} />,
    header: (
      <ColumnHeader>
        <BulkSelectWrapper>
          <CheckBox
            checked={!!selectedItems?.length}
            indeterminate={!!selectedItems?.length && !!hasUnselected}
            onChange={hasUnselected ? onSelectAll : onSelectNone}
            aria-label={t`Select all items`}
          />
        </BulkSelectWrapper>
      </ColumnHeader>
    ),
  };
  defaultColumns.model = {
    index: 1,
    col: <col style={{ width: "70px" }} />,
    header: (
      <SortableColumnHeader
        name="model"
        style={{ marginInlineStart: 6 }}
        {...sortableColumnHeaderProps}
      >
        {t`Type`}
      </SortableColumnHeader>
    ),
  };
  defaultColumns.name = {
    index: 2,
    col: <col />,
    header: (
      <SortableColumnHeader name="name" {...sortableColumnHeaderProps}>
        {t`Name`}
      </SortableColumnHeader>
    ),
  };
  defaultColumns.lastEditedBy = {
    index: 3,
    col: <LastEditedByCol />,
    header: (
      <SortableColumnHeader
        name="last_edited_by"
        {...sortableColumnHeaderProps}
      >
        {t`Last edited by`}
      </SortableColumnHeader>
    ),
    breakpoint: "sm",
  };
  defaultColumns.lastEditedAt = {
    index: 4,
    col: <col style={{ width: "140px" }} />,
    header: (
      <SortableColumnHeader
        name="last_edited_at"
        {...sortableColumnHeaderProps}
      >
        {t`Last edited at`}
      </SortableColumnHeader>
    ),
    breakpoint: "md",
  };
  defaultColumns.actionMenu = {
    index: 5,
    header: <th></th>,
    col: <col style={{ width: "50px" }} />,
  };
  // Just for applying a border-radius to the right edge
  defaultColumns.rightEdge = {
    index: 6,
    header: <th></th>,
    col: <col style={{ width: "1rem" }} />,
  };
  return defaultColumns;
};

const sortColumnByIndex = (a: BaseItemsTableColumn, b: BaseItemsTableColumn) =>
  (a.index ?? 0) - (b.index ?? 0);

const BaseItemsTable = ({
  customColumns,
  databases,
  bookmarks,
  createBookmark,
  deleteBookmark,
  items,
  collection,
  selectedItems,
  hasUnselected,
  isPinned,
  ItemComponent = DefaultItemComponent,
  onCopy,
  onMove,
  onDrop,
  sortingOptions,
  onSortingOptionsChange,
  isSortable: isSortable = true,
  onToggleSelected,
  onSelectAll,
  onSelectNone,
  getIsSelected = () => false,
  headless = false,
  ...props
}: BaseItemsTableProps) => {
  const defaultColumns = getDefaultColumns({
    sortingOptions,
    onSortingOptionsChange,
    selectedItems,
    hasUnselected,
    onSelectAll,
    onSelectNone,
    isSortable,
  });
  const columns: Partial<BaseItemsTableColumnMap> = merge(
    defaultColumns,
    customColumns,
  );

  const canSelect = !!collection?.can_write;

  if (!canSelect) {
    columns.select ??= {};
    columns.select.show = false;
  }

  const shownColumns = _.filter(columns, column => column.show !== false);
  const columnData = _.map(
    shownColumns,
    ({ col, header, index, breakpoint }, colId) => {
      return {
        col: withProps(col, { key: colId }),
        header: withProps(header, { key: colId }),
        index,
        breakpoint,
      };
    },
  );
  columnData.sort(sortColumnByIndex);
  const colElements: ReactNode[] = _.pluck(columnData, "col");
  const headerElements: ReactNode[] = _.pluck(columnData, "header");
  const columnBreakpoints = _.pluck(columnData, "breakpoint");

  return (
    <Table
      canSelect={canSelect}
      columnBreakpoints={columnBreakpoints}
      {...props}
    >
      <colgroup>{colElements}</colgroup>
      {!headless && (
        <thead
          data-testid={
            isPinned ? "pinned-items-table-head" : "items-table-head"
          }
        >
          <tr>{headerElements}</tr>
        </thead>
      )}
      <TBody>
        {items.map((item: CollectionItem) => {
          return (
            <ItemComponent
              key={`${item.model}-${item.id}`}
              item={item}
              databases={databases}
              bookmarks={bookmarks}
              createBookmark={createBookmark}
              deleteBookmark={deleteBookmark}
              collection={collection}
              selectedItems={selectedItems}
              isSelected={getIsSelected(item)}
              isPinned={isPinned}
              onCopy={onCopy}
              onMove={onMove}
              onDrop={onDrop}
              onToggleSelected={onToggleSelected}
              shouldShowActionMenu={columns.actionMenu?.show ?? true}
            />
          );
        })}
      </TBody>
    </Table>
  );
};

BaseItemsTable.Item = BaseTableItem;

// eslint-disable-next-line import/no-default-export
export default BaseItemsTable;
