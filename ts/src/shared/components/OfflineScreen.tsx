import React from "react";

type OfflineScreenProps = {
  onRetry?: () => void;
};

export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry }) => (
  <div className="offline-screen">
    <div className="offline-screen-background" />
    <div className="offline-screen-background-image-container">
      <img
        className="offline-screen-background-image"
        src="../../img/background/ftue-pitched.png"
        alt=""
      />
    </div>

    <div className="offline-screen-content">
      <div className="offline-screen-header">
        <img
          className="offline-screen-logo"
          src="../../icons/logo-256x256.png"
          alt="Marathon Companion"
        />
      </div>
      <div className="offline-screen-title">
        <span className="offline-screen-subtitle">No Internet Connection</span>
        <h1 className="offline-screen-name">You Are Offline</h1>
        <p className="offline-screen-tagline">
          Marathon Companion requires an internet connection to load game data.
          Please check your connection and try again.
        </p>
      </div>
      <div className="offline-screen-info">
        <div className="offline-screen-info-card">
          <div className="offline-screen-info-icon">⚡</div>
          <div className="offline-screen-info-text">
            The app will automatically reconnect when your internet is restored.
          </div>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          className="offline-screen-action"
          onClick={onRetry}
        >
          Retry Connection
        </button>
      )}
    </div>
  </div>
);
