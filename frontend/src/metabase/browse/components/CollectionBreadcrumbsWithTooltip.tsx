import styled from "@emotion/styled";
import classNames from "classnames";
import type { AnchorHTMLAttributes } from "react";
import _ from "underscore";

import { isRootCollection } from "metabase/collections/utils";
import {
  ResponsiveChild,
  ResponsiveContainer,
} from "metabase/components/ResponsiveContainer/ResponsiveContainer";
import { color } from "metabase/lib/colors";
import * as Urls from "metabase/lib/urls";
import type { AnchorProps, FlexProps } from "metabase/ui";
import { Anchor, FixedSizeIcon, Flex, Group, Text, Tooltip } from "metabase/ui";
import type { Collection } from "metabase-types/api";

export const CollectionBreadcrumbsWithTooltip = ({
  collection,
  containerName,
}: {
  collection: Collection;
  containerName: string;
}) => {
  const path = (collection.effective_ancestors || []).concat(collection);
  const hasRoot = path[0] && isRootCollection(path[0]);
  const collections = hasRoot ? path.splice(0, 1) : path;
  const pathString = _.pluck(collections, "name").join(" / ");
  const ellipsifyPath = collections.length > 2;
  const shownCollections = ellipsifyPath
    ? [collections[0], collections[collections.length - 1]]
    : collections;
  const justOneShown = shownCollections.length === 1;

  return (
    <Tooltip variant="multiline" label={pathString}>
      <ResponsiveContainer name={containerName} w="auto">
        <Flex align="center" w="100%" lh="1" style={{ flexFlow: "row nowrap" }}>
          <FixedSizeIcon name="folder" style={{ marginInlineEnd: ".5rem" }} />
          {shownCollections.map((collection, index) => (
            <Group
              spacing={0}
              style={{ flexFlow: "row nowrap" }}
              key={collection.id}
            >
              {index > 0 && <Sep />}
              <CollectionBreadcrumbsWrapper
                containerName={containerName}
                style={{ alignItems: "center" }}
                w="auto"
                display="flex"
              >
                {index === 0 && !justOneShown && (
                  <Ellipsis includeSep={false} className="initial-ellipsis" />
                )}
                {index > 0 && ellipsifyPath && <Ellipsis />}
                <Breadcrumb
                  href={Urls.collection(collection)}
                  className={classNames("breadcrumb", `for-index-${index}`, {
                    "sole-breadcrumb": collections.length === 1,
                  })}
                  maw={
                    justOneShown
                      ? undefined
                      : `calc(${index === 0 ? 38 : 58}cqw - ${
                          ellipsifyPath ? "2rem" : "1rem"
                        })`
                  }
                  key={collection.id}
                >
                  {collection.name}
                </Breadcrumb>
              </CollectionBreadcrumbsWrapper>
            </Group>
          ))}
        </Flex>
      </ResponsiveContainer>
    </Tooltip>
  );
};

export const Breadcrumb = styled(Anchor)<
  AnchorProps & AnchorHTMLAttributes<HTMLAnchorElement>
>`
  color: ${color("text-dark")};
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  :hover {
    color: ${color("brand")};
    text-decoration: none;
  }
`;

// TODO Perhaps ship this but keep in mind that this is slightly worse than just using flexbox (flexbox uses the available space more efficiently) and the code is VERY hard to understand. Why didn't CollectionBreadcrumbs shrink inside the cell like it does at the top of the /model/:id page?
export const CollectionBreadcrumbsWrapper = styled(ResponsiveChild)`
  line-height: 1;
  ${props => {
    const breakpoint = "10rem";
    return `
    @container ${props.containerName} (width < ${breakpoint}) {
      .ellipsis-and-separator {
        display: none;
      }
      .initial-ellipsis {
        display: inline;
      }
      .for-index-0:not(.sole-breadcrumb) {
        display: none;
      }
      .breadcrumb {
        max-width: calc(95cqw - 3rem) ! important;
      }
      .sole-breadcrumb {
        max-width: calc(95cqw - 1rem) ! important;
      }
    }
    @container ${props.containerName} (width >= ${breakpoint}) {
      .initial-ellipsis {
        display: none;
      }
    }
    `;
  }}
`;

const Ellipsis = ({
  includeSep = true,
  ...flexProps
}: { includeSep?: boolean } & FlexProps) => (
  <Flex lh="1" align="center" className="ellipsis-and-separator" {...flexProps}>
    <Text color="text-light">…</Text>
    {includeSep && <Sep />}
  </Flex>
);

const Sep = () => (
  <Text color="text-light" mx="xs">
    /
  </Text>
);
