"use client";

import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
  description?: string;
};

type SearchableSelectProps = {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  noResultsText?: string;
  className?: string;
};

const ChevronIcon = () => (
  <svg
    className="h-4 w-4 text-[#8c4a2f]"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 4 4 4-4" />
  </svg>
);

const ClearIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
    <path strokeLinecap="round" d="M3 3l6 6m0-6-6 6" />
  </svg>
);

const SearchableSelect = ({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = "Започнете да пишете…",
  disabled = false,
  noResultsText = "Няма намерени резултати",
  className = "",
}: SearchableSelectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);

  useEffect(() => {
    setQuery(selectedOption?.label ?? "");
  }, [selectedOption]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }
    if (filteredOptions.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    const selectedIndex = filteredOptions.findIndex((option) => option.value === value);
    setHighlightedIndex(selectedIndex !== -1 ? selectedIndex : 0);
  }, [filteredOptions, isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current || containerRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
      setQuery(selectedOption?.label ?? "");
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  const handleSelect = (option: Option) => {
    setIsOpen(false);
    setQuery(option.label);
    if (option.value !== value) {
      onChange(option.value);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    if (!isOpen) {
      setIsOpen(true);
    }
    if (selectedOption && nextQuery.trim() !== selectedOption.label) {
      onChange("");
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && ["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
      setIsOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        if (filteredOptions.length === 0) {
          return -1;
        }
        const nextIndex = prev + 1;
        return nextIndex >= filteredOptions.length ? 0 : nextIndex;
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        if (filteredOptions.length === 0) {
          return -1;
        }
        const nextIndex = prev - 1;
        return nextIndex < 0 ? filteredOptions.length - 1 : nextIndex;
      });
    } else if (event.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        event.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(selectedOption?.label ?? "");
    }
  };

  const clearSelection = () => {
    setQuery("");
    onChange("");
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label ? (
        <label htmlFor={id} className="text-xs uppercase tracking-[0.2em] text-[#8c4a2f]/70">
          {label}
        </label>
      ) : null}
      <div ref={containerRef} className={`relative ${disabled ? "opacity-60" : ""}`}>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm text-[#5f000b] focus:border-[#5f000b] focus:outline-none"
        />
        {query && !disabled ? (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full bg-[#f0d6db] p-1 text-[#8c4a2f] transition hover:bg-[#ebc3cb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b]/40"
            aria-label="Изчисти избора"
          >
            <ClearIcon />
          </button>
        ) : null}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <ChevronIcon />
        </span>

        {isOpen ? (
          <div
            role="listbox"
            id={id ? `${id}-listbox` : undefined}
            className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-[#f4b9c2] bg-white p-1 shadow-lg"
          >
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[#8c4a2f]/70">{noResultsText}</p>
            ) : (
              filteredOptions.map((option, optionIndex) => {
                const isHighlighted = optionIndex === highlightedIndex;
                const isSelected = option.value === value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                      isHighlighted ? "bg-[#fde4e8] text-[#5f000b]" : "text-[#5f000b]"
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(optionIndex)}
                  >
                    <span className="font-medium">{option.label}</span>
                    {option.description ? (
                      <span className="text-xs text-[#8c4a2f]/70">{option.description}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchableSelect;
