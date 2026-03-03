import React, { useEffect, useState } from 'react';

export const VersionDisplay: React.FC = () => {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    overwolf.extensions.current.getManifest((app) => {
      if (app && app.meta && app.meta.version) {
        setVersion(`v${app.meta.version}`);
      }
    });
  }, []);

  if (!version) {
    return null;
  }

  return <b id="marathon-companion-version" className="companion-version-text">{version}</b>;
};

