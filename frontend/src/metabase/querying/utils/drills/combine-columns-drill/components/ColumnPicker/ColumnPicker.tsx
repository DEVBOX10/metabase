import classNames from "classnames";
import type { FocusEvent, MouseEvent, KeyboardEvent } from "react";
import { useRef, useState, useMemo } from "react";
import { t } from "ttag";

import { QueryColumnPicker } from "metabase/common/components/QueryColumnPicker";
import { Button, Icon, Input, Popover, FocusTrap } from "metabase/ui";
import * as Lib from "metabase-lib";

import styles from "./ColumnPicker.module.css";

type ColumnInputProps = {
  query: Lib.Query;
  stageIndex: number;
  columns: Lib.ColumnMetadata[];
  label?: string;
  value: Lib.ColumnMetadata;
  onChange: (column: Lib.ColumnMetadata) => void;
};

export function ColumnPicker({
  query,
  stageIndex,
  columns,
  label,
  value,
  onChange,
}: ColumnInputProps) {
  const columnGroups = useMemo(() => Lib.groupColumns(columns), [columns]);

  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    button.current?.focus();
  }

  function handleBlur(evt: FocusEvent<HTMLDivElement>) {
    if (!evt.currentTarget || !evt.relatedTarget) {
      return;
    }
    if (!evt.currentTarget.contains(evt.relatedTarget as Node)) {
      setTimeout(() => setOpen(false), 100);
    }
  }

  function handleButtonClick(evt: MouseEvent<HTMLButtonElement>) {
    evt.preventDefault();
    evt.stopPropagation();
    setOpen(open => !open);
  }

  function handleKeyDown(evt: KeyboardEvent<HTMLButtonElement>) {
    if (evt.key === "Enter") {
      setOpen(true);
    }
  }

  const dropdown = (
    <FocusTrap active={open}>
      <div onBlur={handleBlur}>
        <QueryColumnPicker
          query={query}
          stageIndex={stageIndex}
          columnGroups={columnGroups}
          onSelect={onChange}
          onClose={handleClose}
          checkIsColumnSelected={item => item.column === value}
          width="100%"
        />
      </div>
    </FocusTrap>
  );

  const text = useMemo(() => {
    if (!value) {
      return t`Select a column...`;
    }
    const info = Lib.displayInfo(query, stageIndex, value);
    return info.longDisplayName;
  }, [value, query, stageIndex]);

  return (
    <Input.Wrapper label={label} styles={{ root: { width: "100%" } }}>
      <Popover
        opened={open}
        onClose={handleClose}
        onOpen={handleOpen}
        closeOnEscape
        closeOnClickOutside
        width="target"
        returnFocus
      >
        <Popover.Target>
          <Button
            ref={button}
            onMouseDownCapture={handleButtonClick}
            onKeyDown={handleKeyDown}
            fullWidth
            classNames={{
              root: classNames(styles.root, open && styles.open),
              inner: styles.button,
            }}
            rightIcon={<Icon name="chevrondown" style={{ height: 14 }} />}
          >
            {text}
          </Button>
        </Popover.Target>
        <Popover.Dropdown>{dropdown}</Popover.Dropdown>
      </Popover>
    </Input.Wrapper>
  );
}
