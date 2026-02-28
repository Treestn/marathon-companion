import React from 'react';
import { getEnabledPages, PageConfig } from '../../pages/PageRegistry';
import './main-navigation-bar.css';

const getIconPath = (iconPath: string): string => {
  if (!iconPath) {
    return iconPath;
  }
  let normalized = iconPath;
  if (normalized.startsWith('../')) {
    normalized = normalized.replace('../', './');
  } else if (!normalized.startsWith('./')) {
    normalized = `./${normalized}`;
  }
  return normalized;
};

type MainNavigationBarProps = {
  activePageId: string;
  onSelectPage?: (pageId: string) => void;
  pages?: PageConfig[];
};

export const MainNavigationBar: React.FC<MainNavigationBarProps> = ({
  activePageId,
  onSelectPage,
  pages: providedPages,
}) => {
  const pages = providedPages ?? getEnabledPages();
  const topPages = pages.filter((page) => page.id !== "settings");
  const settingsPage = pages.find((page) => page.id === "settings");

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <div className="main-navigation-section main-navigation-top">
        {topPages.map(page => {
          const isActive = page.id === activePageId;
          return (
          <button
            key={page.id}
            id={page.navigationId}
            type="button"
            className={`page-icon-container main-navigation-item${isActive ? ' is-active' : ''}`}
            onClick={() => onSelectPage?.(page.id)}
            aria-pressed={isActive}
          >
            <div className="page-icon-image-container">
              <img
                className="page-icon-image"
                src={getIconPath(page.icon)}
                alt={page.name}
              />
            </div>
            <div className="icon-text-container">
              <b className="icon-text">{page.name}</b>
            </div>
          </button>
          );
        })}
      </div>

      <div className="main-navigation-section main-navigation-bottom">
        <button
          id="subscriptionButton"
          type="button"
          className={`page-icon-container main-navigation-item${
            activePageId === 'subscription' ? ' is-active' : ''
          }`}
          onClick={() => onSelectPage?.('subscription')}
          aria-pressed={activePageId === 'subscription'}
        >
          <div className="page-icon-image-container">
            <img
              className="page-icon-image subscription-button-image"
              src={
                activePageId === 'subscription'
                  ? "./icons/logo-subscription-active-256x256.png"
                  : "./icons/logo-subscription-256x256.png"
              }
              alt="Subscription"
            />
          </div>
          <div className="icon-text-container">
            <b className="icon-text">Premium</b>
          </div>
        </button>
        {settingsPage && (
          <button
            key={settingsPage.id}
            id={settingsPage.navigationId}
            type="button"
            className={`page-icon-container main-navigation-item${
              activePageId === settingsPage.id ? " is-active" : ""
            }`}
            onClick={() => onSelectPage?.(settingsPage.id)}
            aria-pressed={activePageId === settingsPage.id}
          >
            <div className="page-icon-image-container">
              <img
                className="page-icon-image"
                src={getIconPath(settingsPage.icon)}
                alt={settingsPage.name}
              />
            </div>
            <div className="icon-text-container">
              <b className="icon-text">{settingsPage.name}</b>
            </div>
          </button>
        )}
      </div>
    </nav>
  );
};
