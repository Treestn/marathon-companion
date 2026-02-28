import React, { useEffect, useMemo, useRef, useState } from "react";

type QuestFilterOption = {
  value: string;
  label: string;
};

type QuestFilterSelectProps = {
  id: string;
  label: string;
  value?: string[];
  options: QuestFilterOption[];
  onChange?: (value: string[]) => void;
  iconSrc?: string;
};

export const QuestFilterSelect: React.FC<QuestFilterSelectProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  iconSrc = "../../icons/logo-256x256.png",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(value ?? []);

  const selectedCount = selectedValues.length;
  const isActive = selectedCount > 0;
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  useEffect(() => {
    if (value) {
      setSelectedValues(value);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleValue = (optionValue: string) => {
    const next = new Set(selectedValues);
    if (next.has(optionValue)) {
      next.delete(optionValue);
    } else {
      next.add(optionValue);
    }
    const result = Array.from(next);
    setSelectedValues(result);
    onChange?.(result);
  };

  return (
    <div
      ref={containerRef}
      className={`quest-filter${isActive ? " is-active" : ""}`}
      id={id}
    >
      <button
        className={`quest-filter-trigger${isActive ? " is-active" : ""}`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <img className="quest-filter-icon" src={iconSrc} alt="" />
        <div className="quest-filter-trigger-left">
          <span className="quest-filter-label">{label}</span>
        </div>
        <div className="quest-filter-trigger-right">
          <span className="quest-filter-count">{selectedCount}</span>
          <span className="quest-filter-arrow" aria-hidden="true">
            ▾
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="quest-filter-menu">
          {options.map((option) => {
            const checked = selectedSet.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={`quest-filter-option${checked ? " is-selected" : ""}`}
                onClick={() => toggleValue(option.value)}
                aria-pressed={checked}
              >
                <span className="quest-filter-option-label">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
