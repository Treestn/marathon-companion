import React from 'react';
import './ads-control-buttons.css';

type AdsControlButtonsProps = {
  onStart: () => void;
  onStop: () => void;
  onDestroy: () => void;
  className?: string;
};

export const AdsControlButtons: React.FC<AdsControlButtonsProps> = ({
  onStart,
  onStop,
  onDestroy,
  className,
}) => {
  const wrapperClass = className
    ? `ads-control-buttons ${className}`
    : 'ads-control-buttons';

  return (
    <div className={wrapperClass}>
      <button type="button" className="ads-control-button" onClick={onStart}>
        Start Ads
      </button>
      <button type="button" className="ads-control-button" onClick={onStop}>
        Stop Ads
      </button>
      <button type="button" className="ads-control-button" onClick={onDestroy}>
        Destroy Ads
      </button>
    </div>
  );
};
