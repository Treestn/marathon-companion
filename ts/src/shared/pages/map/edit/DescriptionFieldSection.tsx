import React from "react";

type DescriptionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
};

export const DescriptionField: React.FC<DescriptionFieldProps> = ({
  value,
  onChange,
  isDisabled = false,
}) => (
  <div className="map-edit-field">
    <label className="map-edit-field-label" htmlFor="map-edit-description">
      Description
    </label>
    <textarea
      id="map-edit-description"
      className="map-edit-textarea"
      placeholder="Add a description..."
      value={value}
      disabled={isDisabled}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);
