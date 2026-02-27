import React, { useState, useEffect, useRef } from 'react';
import { ItemsElementUtils } from '../../../escape-from-tarkov/utils/ItemsElementUtils';
import { Item } from '../../../model/items/IItemsElements';

interface ItemSelectorProps {
  value: string; // item id
  onChange: (itemId: string, itemName: string, imageUrl: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ItemSelector: React.FC<ItemSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Search for an item...',
  disabled = false
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load items from ItemsElementUtils
  useEffect(() => {
    const itemsData = ItemsElementUtils.getAllItems();
    if (itemsData.length > 0) {
      // Filter out items without names or IDs
      const validItems = itemsData.filter(item =>
        item && item.id && item.name
      );
      setItems(validItems);
      setFilteredItems(validItems);
    }
  }, []);

  // Update selected item when value changes
  useEffect(() => {
    if (value && items.length > 0) {
      const item = items.find(i => i.id === value);
      if (item && item.name) {
        setSelectedItem(item);
        setSearchTerm(item.name);
      }
    } else {
      setSelectedItem(null);
      setSearchTerm('');
    }
  }, [value, items]);

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = items.filter(item =>
      item.name && item.name.toLowerCase().includes(searchLower)
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (!e.target.value) {
      setSelectedItem(null);
      onChange('', '', '');
    }
  };

  const handleItemSelect = (item: Item) => {
    if (!item || !item.id || !item.name) {
      console.error('Invalid item selected:', item);
      return;
    }
    setSelectedItem(item);
    setSearchTerm(item.name);
    setIsOpen(false);
    onChange(item.id, item.name, item.url || '');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && filteredItems.length > 0) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className="trading-item-selector" ref={dropdownRef}>
      <div className="trading-item-selector-input-wrapper">
        {selectedItem && selectedItem.url && (
          <img
            src={selectedItem.url}
            alt={selectedItem.name}
            className="trading-item-selector-image"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="trading-modal-input trading-item-selector-input"
        />
      </div>

      {isOpen && !disabled && filteredItems.length > 0 && (
        <div className="trading-item-selector-dropdown scroll-div">
          {filteredItems.slice(0, 10).map((item) => {
            if (!item || !item.id || !item.name) {
              return null;
            }
            return (
              <div
                key={item.id}
                className={`trading-item-selector-option ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => handleItemSelect(item)}
              >
                {item.url && (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="trading-item-selector-option-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span className="trading-item-selector-option-name">{item.name}</span>
              </div>
            );
          })}
          {filteredItems.length > 10 && (
            <div className="trading-item-selector-more">
              Showing first 10 of {filteredItems.length} results
            </div>
          )}
        </div>
      )}

      {isOpen && !disabled && searchTerm && filteredItems.length === 0 && (
        <div className="trading-item-selector-dropdown scroll-div">
          <div className="trading-item-selector-no-results">
            No items found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

