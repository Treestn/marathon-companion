import React from "react";
import "./page-header.css";

type PageHeaderProps = {
  title: string;
  iconSrc: string;
  iconAlt?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  iconSrc,
  iconAlt,
  subtitle,
  actions,
  className,
}) => {
  const headerClassName = className ? `mc-page-header ${className}` : "mc-page-header";

  return (
    <header className={headerClassName}>
      <div className="mc-page-header__top">
        <div className="mc-page-header__main">
          <img className="mc-page-header__icon" src={iconSrc} alt={iconAlt ?? ""} />
          <h1 className="mc-page-header__title">{title}</h1>
        </div>
        {actions ? <div className="mc-page-header__actions">{actions}</div> : null}
      </div>
      {subtitle ? <p className="mc-page-header__subtitle">{subtitle}</p> : null}
    </header>
  );
};
