/* eslint-disable react/prop-types */
import cx from "classnames";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { push } from "react-router-redux";
import { usePrevious } from "react-use";
import { t } from "ttag";

import ErrorBoundary from "metabase/ErrorBoundary";
import BulkActions from "metabase/collections/components/BulkActions";
import { ArchivedEntityBanner } from "metabase/collections/components/CollectionArchiveBanner";
import CollectionEmptyState from "metabase/collections/components/CollectionEmptyState";
import ItemsTable from "metabase/collections/components/ItemsTable";
import PinnedItemOverview from "metabase/collections/components/PinnedItemOverview";
import Header from "metabase/collections/containers/CollectionHeader";
import type {
  CreateBookmark,
  DeleteBookmark,
  OnFileUpload,
  UploadFile,
} from "metabase/collections/types";
import {
  isRootTrashCollection,
  isPersonalCollectionChild,
} from "metabase/collections/utils";
import PaginationControls from "metabase/components/PaginationControls";
import ItemsDragLayer from "metabase/containers/dnd/ItemsDragLayer";
import CS from "metabase/css/core/index.css";
import Collections from "metabase/entities/collections";
import { TRASH_COLLECTION } from "metabase/entities/collections/constants";
import Search from "metabase/entities/search";
import { useListSelect } from "metabase/hooks/use-list-select";
import { usePagination } from "metabase/hooks/use-pagination";
import { useToggle } from "metabase/hooks/use-toggle";
import { useDispatch } from "metabase/lib/redux";
import * as Urls from "metabase/lib/urls";
import { addUndo } from "metabase/redux/undo";
import type Database from "metabase-lib/v1/metadata/Database";
import type {
  Bookmark,
  Collection,
  CollectionId,
  CollectionItem,
} from "metabase-types/api";

import { Sort, type SortingOptions } from "../BaseItemsTable";
import type { CollectionOrTableIdProps } from "../ModelUploadModal";
import { ModelUploadModal } from "../ModelUploadModal";
import UploadOverlay from "../UploadOverlay";

import {
  CollectionEmptyContent,
  CollectionMain,
  CollectionRoot,
  CollectionTable,
} from "./CollectionContent.styled";
import { getComposedDragProps } from "./utils";

const PAGE_SIZE = 25;

const ALL_MODELS = [
  "dashboard",
  "dataset",
  "card",
  "snippet",
  "pulse",
  "collection",
];

const itemKeyFn = (item: CollectionItem) => `${item.id}:${item.model}`;

// TODO: check if the collection is archived, if so, show a different bulk actions modal...

export const CollectionContentView = ({
  databases,
  bookmarks,
  collection,
  collections: collectionList = [],
  collectionId,
  createBookmark,
  deleteBookmark,
  isAdmin,
  isNavbarOpen,
  uploadFile,
  uploadsEnabled,
  canUploadToDb,
}: {
  databases?: Database[];
  bookmarks?: Bookmark[];
  collection: Collection;
  collections: Collection[];
  collectionId: CollectionId;
  createBookmark: CreateBookmark;
  deleteBookmark: DeleteBookmark;
  isAdmin: boolean;
  isNavbarOpen: boolean;
  uploadFile: UploadFile;
  uploadsEnabled: boolean;
  canUploadToDb: boolean;
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedItems, setSelectedItems] = useState<CollectionItem[] | null>(
    null,
  );
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [unpinnedItemsSorting, setUnpinnedItemsSorting] =
    useState<SortingOptions>({
      sort_column: "name",
      sort_direction: Sort.Asc,
    });

  const [
    isModelUploadModalOpen,
    { turnOn: openModelUploadModal, turnOff: closeModelUploadModal },
  ] = useToggle(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const saveFile = (file: File) => {
    setUploadedFile(file);
    openModelUploadModal();
  };

  const handleUploadFile = useCallback<OnFileUpload>(
    (props: CollectionOrTableIdProps) => {
      const { collectionId, tableId } = props;
      if (uploadedFile && (collectionId || tableId)) {
        closeModelUploadModal();
        uploadFile({
          file: uploadedFile,
          ...props,
        });
      }
    },
    [uploadFile, uploadedFile, closeModelUploadModal],
  );

  const { handleNextPage, handlePreviousPage, setPage, page, resetPage } =
    usePagination();
  const { clear, getIsSelected, selected, selectOnlyTheseItems, toggleItem } =
    useListSelect(itemKeyFn);
  const previousCollection = usePrevious(collection);

  useEffect(() => {
    if (previousCollection && previousCollection.id !== collection.id) {
      clear();
      resetPage();
    }
  }, [previousCollection, collection, clear, resetPage]);

  useEffect(() => {
    const shouldBeBookmarked = !!bookmarks?.some(
      bookmark =>
        bookmark.type === "collection" && bookmark.item_id === collectionId,
    );
    setIsBookmarked(shouldBeBookmarked);
  }, [bookmarks, collectionId]);

  const dispatch = useDispatch();

  const onDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) {
      dispatch(
        addUndo({
          message: t`Invalid file type`,
          toastColor: "error",
          icon: "warning",
        }),
      );
      return;
    }
    saveFile(acceptedFiles[0]);
  };

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    noClick: true,
    noDragEventsBubbling: true,
    accept: { "text/csv": [".csv"], "text/tab-separated-values": [".tsv"] },
  });

  const handleUnpinnedItemsSortingChange = useCallback(
    (sortingOpts: SortingOptions) => {
      setUnpinnedItemsSorting(sortingOpts);
      setPage(0);
    },
    [setPage],
  );

  const handleMove = (selectedItems: CollectionItem[]) => {
    setSelectedItems(selectedItems);
    setSelectedAction("move");
  };

  const handleCopy = (selectedItems: CollectionItem[]) => {
    setSelectedItems(selectedItems);
    setSelectedAction("copy");
  };

  const handleCreateBookmark = () => {
    createBookmark(collectionId.toString(), "collection");
  };

  const handleDeleteBookmark = () => {
    deleteBookmark(collectionId.toString(), "collection");
  };

  const canUpload = uploadsEnabled && canUploadToDb && collection.can_write;

  const dropzoneProps = canUpload ? getComposedDragProps(getRootProps()) : {};

  const unpinnedQuery = {
    collection: collectionId,
    models: ALL_MODELS,
    limit: PAGE_SIZE,
    offset: PAGE_SIZE * page,
    ...(isRootTrashCollection(collection)
      ? {}
      : { pinned_state: "is_not_pinned" }),
    ...unpinnedItemsSorting,
  };

  const pinnedQuery = {
    collection: collectionId,
    pinned_state: "is_pinned",
    sort_column: "name",
    sort_direction: "asc",
  };

  return (
    <Search.ListLoader
      query={pinnedQuery}
      loadingAndErrorWrapper={false}
      keepListWhileLoading
      wrapped
    >
      {({
        list,
        loading: loadingPinnedItems,
      }: {
        list: CollectionItem[];
        loading: boolean;
      }) => {
        const pinnedItems =
          list && !isRootTrashCollection(collection) ? list : [];
        const hasPinnedItems = pinnedItems.length > 0;

        return (
          <CollectionRoot {...dropzoneProps}>
            {canUpload && (
              <>
                <ModelUploadModal
                  collectionId={collectionId}
                  opened={isModelUploadModalOpen}
                  onClose={closeModelUploadModal}
                  onUpload={handleUploadFile}
                />
                <UploadOverlay
                  isDragActive={isDragActive}
                  collection={collection}
                />
              </>
            )}

            {collection.archived && (
              <ArchivedEntityBanner
                entity="collection"
                onUnarchive={() => {
                  dispatch(
                    Collections.actions.setArchived(
                      { id: collectionId },
                      false,
                    ),
                  );
                }}
                onDeletePermanently={async () => {
                  await dispatch(
                    Collections.actions.delete({ id: collectionId }),
                  );
                  dispatch(push(Urls.collection(TRASH_COLLECTION)));
                  dispatch(addUndo({ message: t`Deletion successful` }));
                }}
              />
            )}

            <CollectionMain>
              <ErrorBoundary>
                <Header
                  collection={collection}
                  isAdmin={isAdmin}
                  isBookmarked={isBookmarked}
                  isPersonalCollectionChild={isPersonalCollectionChild(
                    collection,
                    collectionList,
                  )}
                  onCreateBookmark={handleCreateBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                  canUpload={canUpload}
                  uploadsEnabled={uploadsEnabled}
                  saveFile={saveFile}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <PinnedItemOverview
                  databases={databases}
                  bookmarks={bookmarks}
                  createBookmark={createBookmark}
                  deleteBookmark={deleteBookmark}
                  items={pinnedItems}
                  collection={collection}
                  onMove={handleMove}
                  onCopy={handleCopy}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <Search.ListLoader
                  query={unpinnedQuery}
                  loadingAndErrorWrapper={false}
                  keepListWhileLoading
                  wrapped
                >
                  {({
                    list: unpinnedItems = [],
                    metadata = {},
                    loading: loadingUnpinnedItems,
                  }: {
                    list: CollectionItem[];
                    metadata: { total?: number };
                    loading: boolean;
                  }) => {
                    const hasPagination: boolean =
                      !!metadata.total && metadata.total > PAGE_SIZE;

                    const unselected = unpinnedItems.filter(
                      item => !getIsSelected(item),
                    );
                    const hasUnselected = unselected.length > 0;

                    const handleSelectAll = () => {
                      selectOnlyTheseItems(unpinnedItems);
                    };

                    const loading = loadingPinnedItems || loadingUnpinnedItems;
                    const isEmpty =
                      !loading && !hasPinnedItems && unpinnedItems.length === 0;

                    if (isEmpty && !loadingUnpinnedItems) {
                      return (
                        <CollectionEmptyContent>
                          <CollectionEmptyState collection={collection} />
                        </CollectionEmptyContent>
                      );
                    }

                    return (
                      <CollectionTable data-testid="collection-table">
                        <ItemsTable
                          databases={databases}
                          bookmarks={bookmarks}
                          createBookmark={createBookmark}
                          deleteBookmark={deleteBookmark}
                          items={unpinnedItems}
                          collection={collection}
                          sortingOptions={unpinnedItemsSorting}
                          onSortingOptionsChange={
                            handleUnpinnedItemsSortingChange
                          }
                          selectedItems={selected}
                          hasUnselected={hasUnselected}
                          getIsSelected={getIsSelected}
                          onToggleSelected={toggleItem}
                          onDrop={clear}
                          onMove={handleMove}
                          onCopy={handleCopy}
                          onSelectAll={handleSelectAll}
                          onSelectNone={clear}
                        />
                        <div className={cx(CS.flex, CS.justifyEnd, CS.my3)}>
                          {hasPagination && (
                            <PaginationControls
                              showTotal
                              page={page}
                              pageSize={PAGE_SIZE}
                              total={metadata.total}
                              itemsLength={unpinnedItems.length}
                              onNextPage={handleNextPage}
                              onPreviousPage={handlePreviousPage}
                            />
                          )}
                        </div>
                        <BulkActions
                          collection={collection}
                          selected={selected}
                          clearSelected={clear}
                          selectedItems={selectedItems}
                          setSelectedItems={setSelectedItems}
                          selectedAction={selectedAction}
                          setSelectedAction={setSelectedAction}
                          isNavbarOpen={isNavbarOpen}
                        />
                      </CollectionTable>
                    );
                  }}
                </Search.ListLoader>
              </ErrorBoundary>
            </CollectionMain>
            <ItemsDragLayer
              selectedItems={selected}
              pinnedItems={pinnedItems}
              collection={collection}
            />
          </CollectionRoot>
        );
      }}
    </Search.ListLoader>
  );
};
