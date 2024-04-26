import { useCallback } from "react";

import {
  EntityIconCheckBox,
  ItemCell,
  ItemLink,
  ItemNameCell,
} from "metabase/collections/components/BaseItemsTable.styled";
import type {
  CreateBookmark,
  DeleteBookmark,
  OnCopy,
  OnDrop,
  OnMove,
  OnToggleSelectedWithItem,
} from "metabase/collections/types";
import EntityItem from "metabase/components/EntityItem";
import ItemDragSource from "metabase/containers/dnd/ItemDragSource";
import { Ellipsified } from "metabase/core/components/Ellipsified";
import { color } from "metabase/lib/colors";
import { PLUGIN_MODERATION } from "metabase/plugins";
import type Database from "metabase-lib/v1/metadata/Database";
import type { Bookmark, Collection, CollectionItem } from "metabase-types/api";

import { CollectionBreadcrumbsWithTooltip } from "./CollectionBreadcrumbsWithTooltip";

export type BrowseTableItemProps = {
  databases?: Database[];
  bookmarks?: Bookmark[];
  createBookmark?: CreateBookmark;
  deleteBookmark?: DeleteBookmark;
  item: CollectionItem;
  draggable?: boolean;
  collection?: Collection;
  selectedItems?: CollectionItem[];
  isSelected?: boolean;
  isPinned?: boolean;
  linkProps?: any;
  onCopy?: OnCopy;
  onMove?: OnMove;
  onDrop?: OnDrop;
  onToggleSelected?: OnToggleSelectedWithItem;
  shouldShowActionMenu?: boolean;
};

export const BrowseTableItem = ({
  item,
  draggable = false,
  collection,
  selectedItems,
  isSelected,
  isPinned,
  linkProps = {},
  onDrop,
  onToggleSelected,
}: BrowseTableItemProps) => {
  const handleSelectionToggled = useCallback(() => {
    onToggleSelected?.(item);
  }, [item, onToggleSelected]);

  const renderRow = useCallback(() => {
    const canSelect =
      !!collection?.can_write && typeof onToggleSelected === "function";

    const testId = isPinned ? "pinned-collection-entry" : "collection-entry";

    const trStyles = {
      height: 48,
    };

    const icon = item.getIcon();
    if (item.model === "card") {
      icon.color = color("text-light");
    }
    const containerName = `container-for-collections-of-${item.id}`;

    // Table row can be wrapped with ItemDragSource,
    // that only accepts native DOM elements as its children
    // So styled-components can't be used here
    return (
      <tr key={item.id} data-testid={testId} style={trStyles}>
        {canSelect && (
          <ItemCell data-testid={`${testId}-check`}>
            <EntityIconCheckBox
              variant="list"
              icon={icon}
              pinned={isPinned}
              selected={isSelected}
              onToggleSelected={handleSelectionToggled}
              selectable
              showCheckbox
            />
          </ItemCell>
        )}
        <ItemCell data-testid={`${testId}-type`} style={{ paddingRight: 0 }}>
          <EntityIconCheckBox variant="list" icon={icon} pinned={isPinned} />
        </ItemCell>
        <ItemNameCell data-testid={`${testId}-name`}>
          <ItemLink {...linkProps} to={item.getUrl()}>
            <Ellipsified>
              <EntityItem.Name name={item.name} variant="list" />
            </Ellipsified>
            <PLUGIN_MODERATION.ModerationStatusIcon
              size={16}
              status={item.moderated_status}
            />
          </ItemLink>
        </ItemNameCell>
        <ItemCell>
          <Ellipsified>{item.description}</Ellipsified>
        </ItemCell>
        <ItemCell>
          {item.collection && (
            <CollectionBreadcrumbsWithTooltip
              containerName={containerName}
              collection={item.collection}
            />
          )}
        </ItemCell>
        <ItemCell width="1rem"></ItemCell>
      </tr>
    );
  }, [
    onToggleSelected,
    item,
    isPinned,
    isSelected,
    handleSelectionToggled,
    linkProps,
    collection,
  ]);

  if (!draggable) {
    return renderRow();
  }

  return (
    <ItemDragSource
      item={item}
      collection={collection}
      isSelected={isSelected}
      selected={selectedItems}
      onDrop={onDrop}
    >
      {renderRow()}
    </ItemDragSource>
  );
};

// eslint-disable-next-line import/no-default-export
export default BrowseTableItem;
