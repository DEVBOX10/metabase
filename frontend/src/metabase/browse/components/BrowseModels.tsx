import { useCallback, useMemo, useState } from "react";
import { t } from "ttag";
import _ from "underscore";

import NoResults from "assets/img/no_results.svg";
import { useSearchQuery } from "metabase/api";
import type { SortingOptions } from "metabase/collections/components/BaseItemsTable";
import { ColumnHeader } from "metabase/collections/components/BaseItemsTable.styled";
import ItemsTable from "metabase/collections/components/ItemsTable";
import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";
import Search from "metabase/entities/search";
import { color } from "metabase/lib/colors";
import { useDispatch } from "metabase/lib/redux";
import { PLUGIN_CONTENT_VERIFICATION } from "metabase/plugins";
import { Box, Flex, Group, Icon, Stack, Title } from "metabase/ui";

import { filterModels, type ActualModelFilters } from "../utils";

import {
  BrowseContainer,
  BrowseHeader,
  BrowseMain,
  BrowseSection,
  CenteredEmptyState,
} from "./BrowseApp.styled";
import BrowseTableItem from "./BrowseTableItem";
import { ModelExplanationBanner } from "./ModelExplanationBanner";

const availableModelFilters = PLUGIN_CONTENT_VERIFICATION.availableModelFilters;

export const BrowseModels = () => {
  const getInitialModelFilters = () => {
    return _.reduce(
      availableModelFilters,
      (acc, filter, filterName) => {
        const storedFilterStatus = localStorage.getItem(
          `browseFilters.${filterName}`,
        );
        const shouldFilterBeActive =
          storedFilterStatus === null
            ? filter.activeByDefault
            : storedFilterStatus === "on";
        return {
          ...acc,
          [filterName]: shouldFilterBeActive,
        };
      },
      {},
    );
  };

  const [actualModelFilters, setActualModelFilters] =
    useState<ActualModelFilters>(getInitialModelFilters);

  const handleModelFilterChange = useCallback(
    (modelFilterName: string, active: boolean) => {
      localStorage.setItem(
        `browseFilters.${modelFilterName}`,
        active ? "on" : "off",
      );
      setActualModelFilters((prev: ActualModelFilters) => {
        return { ...prev, [modelFilterName]: active };
      });
    },
    [setActualModelFilters],
  );

  return (
    <BrowseContainer>
      <BrowseHeader>
        <BrowseSection>
          <Flex w="100%" direction="row" justify="space-between" align="center">
            <Title order={1} color="text-dark">
              <Group spacing="sm">
                <Icon size={18} color={color("brand")} name="model" />
                {t`Models`}
              </Group>
            </Title>
            <PLUGIN_CONTENT_VERIFICATION.ModelFilterControls
              actualModelFilters={actualModelFilters}
              handleModelFilterChange={handleModelFilterChange}
            />
          </Flex>
        </BrowseSection>
      </BrowseHeader>
      <BrowseMain>
        <BrowseSection>
          <BrowseModelsBody actualModelFilters={actualModelFilters} />
        </BrowseSection>
      </BrowseMain>
    </BrowseContainer>
  );
};

export const BrowseModelsBody = ({
  actualModelFilters,
}: {
  actualModelFilters: ActualModelFilters;
}) => {
  const dispatch = useDispatch();
  const { data, error, isFetching } = useSearchQuery({
    models: ["dataset"],
    model_ancestors: true,
    filter_items_in_personal_collection: "exclude",
  });
  const unfilteredModels = data?.data;

  const models = useMemo(
    () =>
      filterModels(
        unfilteredModels || [],
        actualModelFilters,
        availableModelFilters,
      ),
    [unfilteredModels, actualModelFilters],
  );

  const sortingOptions: SortingOptions = {
    sort_column: "name",
    sort_direction: "asc",
  };
  const wrappedModels = models.map(model => Search.wrapEntity(model, dispatch));

  if (error || isFetching) {
    return (
      <LoadingAndErrorWrapper
        error={error}
        loading={isFetching}
        style={{ display: "flex", flex: 1 }}
      />
    );
  }

  if (models.length) {
    return (
      <Stack spacing="md" mb="lg">
        <ModelExplanationBanner />
        <ItemsTable
          ItemComponent={BrowseTableItem}
          items={wrappedModels}
          sortingOptions={sortingOptions}
          isSortable={false}
          onSortingOptionsChange={() => {}}
          customColumns={{
            lastEditedBy: {
              show: false,
            },
            lastEditedAt: {
              show: false,
            },
            model: {
              col: <col style={{ width: "3rem" }} />,
              header: <th>&nbsp;</th>,
            },
            name: {
              col: <col style={{ width: "12rem" }} />,
            },
            actionMenu: { show: false },
            description: {
              index: 3,
              col: <col />,
              header: <ColumnHeader>{t`Description`}</ColumnHeader>,
              breakpoint: "sm",
            },
            collection: {
              index: 4,
              col: <col />,
              header: <ColumnHeader>{t`Collection`}</ColumnHeader>,
              breakpoint: "sm",
            },
          }}
        />
      </Stack>
    );
  }

  return (
    <CenteredEmptyState
      title={<Box mb=".5rem">{t`No models here yet`}</Box>}
      message={
        <Box maw="24rem">{t`Models help curate data to make it easier to find answers to questions all in one place.`}</Box>
      }
      illustrationElement={
        <Box mb=".5rem">
          <img src={NoResults} />
        </Box>
      }
    />
  );
};
