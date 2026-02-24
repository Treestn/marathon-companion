import React from 'react';
import './ads.css';

type AdRunnerContainerProps = {
  containerId?: string;
  runnerId?: string;
  className?: string;
};

export const AdRunnerContainer: React.FC<AdRunnerContainerProps> = ({
  containerId = 'ad-runner-container',
  runnerId = 'ad-runner',
  className,
}) => {
  return (
    <div id={containerId} className={className}>
      <div id="ad-runner-small" />
      <div id={runnerId} />
    </div>
  );
};
