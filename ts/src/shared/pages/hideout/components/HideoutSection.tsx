import React from "react";

type HideoutSectionProps = {
  title: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export const HideoutSection: React.FC<HideoutSectionProps> = ({
  title,
  actions,
  children,
}) => {
  return (
    <section className="hideout-section">
      <div className="hideout-section-header">
        <div className="hideout-section-title">{title}</div>
        {actions && <div className="hideout-section-actions">{actions}</div>}
      </div>
      <div className="hideout-section-body">{children}</div>
    </section>
  );
};
