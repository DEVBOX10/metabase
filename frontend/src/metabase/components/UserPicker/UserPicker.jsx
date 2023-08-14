import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
import TokenField from "metabase/components/TokenField";
import MetabaseUtils from "metabase/lib/utils";
import {
  UserPickerAvatar,
  UserPickerOption,
  UserPickerRoot,
  UserPickerText,
} from "./UserPicker.styled";

const propTypes = {
  value: PropTypes.array.isRequired,
  validateValue: PropTypes.func,
  users: PropTypes.array.isRequired,
  onChange: PropTypes.func,
  canAddItems: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  placeholder: PropTypes.string,
};

const UserPicker = ({
  value,
  validateValue,
  users,
  canAddItems,
  onChange,
  style,
  className,
  placeholder: customPlaceholder,
}) => {
  const placeholder = !value.length
    ? customPlaceholder || t`Enter user names or email addresses`
    : null;

  const options = useMemo(() => {
    return users.map(user => ({ value: user }));
  }, [users]);

  const idKey = useCallback(value => {
    console.log(value);
    return value.id || value.email;
  }, []);

  const valueRenderer = useCallback(value => {
    return value.common_name;
  }, []);

  const optionRenderer = useCallback(option => {
    return (
      <UserPickerOption>
        <UserPickerAvatar user={option.value} />
        <UserPickerText>{option.value.common_name}</UserPickerText>
      </UserPickerOption>
    );
  }, []);

  const filterOption = useCallback((option, text) => {
    return (
      includesIgnoreCase(option.value.common_name, text) ||
      includesIgnoreCase(option.value.email, text)
    );
  }, []);

  const parseFreeformValue = useCallback(text => {
    if (MetabaseUtils.isEmail(text)) {
      return { email: text };
    }
  }, []);

  console.log(value);

  return (
    <UserPickerRoot style={style} className={className}>
      <TokenField
        idKey={idKey}
        value={value}
        validateValue={validateValue}
        valueRenderer={valueRenderer}
        options={options}
        optionRenderer={optionRenderer}
        filterOption={filterOption}
        parseFreeformValue={parseFreeformValue}
        placeholder={placeholder}
        multi
        updateOnInputBlur
        onChange={onChange}
        canAddItems={canAddItems}
      />
    </UserPickerRoot>
  );
};

const includesIgnoreCase = (sourceText, searchText) => {
  return sourceText.toLowerCase().includes(searchText.toLowerCase());
};

UserPicker.propTypes = propTypes;

export default UserPicker;
