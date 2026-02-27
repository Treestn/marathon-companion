import React from 'react';

type NavPage = {
  id: string;
  label: string;
};

const NAV_PAGES: NavPage[] = [
  { id: 'maps', label: 'Maps' },
  { id: 'quests', label: 'Active Contracts' },
];

type SecondScreenNavigationBarProps = {
  activePageId: string;
  onNavigate: (pageId: string) => void;
};

export const SecondScreenNavigationBar: React.FC<SecondScreenNavigationBarProps> = ({
  activePageId,
  onNavigate,
}) => {
  const handleNavigate = (pageId: string) => {
    if (activePageId === pageId) {
      return;
    }
    onNavigate(pageId);
  };

  return (
    <nav className="second-screen-nav-list">
      {NAV_PAGES.map(page => (
        <button
          key={page.id}
          className={`second-screen-nav-item${activePageId === page.id ? ' is-active' : ''}`}
          onClick={() => handleNavigate(page.id)}
          type="button"
        >
          {page.label}
        </button>
      ))}
    </nav>
  );
};
