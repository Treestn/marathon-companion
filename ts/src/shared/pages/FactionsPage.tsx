import React, { useMemo, useState } from "react";
import { FACTIONS_DATA, FactionModel } from "../../model/faction/IFactionsElements";
import "./factions/factions.css";

const getFactionImagePath = (name: string): string => {
  return `/img/faction/${name.toLowerCase()}.png`;
};

export const FactionsPage: React.FC = () => {
  const initialFactionId = useMemo(() => {
    return FACTIONS_DATA.find((faction) => faction.name.toLowerCase() === "cyberacme")?.factionId ?? FACTIONS_DATA[0]?.factionId ?? "";
  }, []);
  const [activeFactionId, setActiveFactionId] = useState(initialFactionId);

  const activeFaction = useMemo<FactionModel | null>(() => {
    return FACTIONS_DATA.find((faction) => faction.factionId === activeFactionId) ?? null;
  }, [activeFactionId]);
  const activeFactionMaskPath = useMemo(() => {
    if (!activeFaction) {
      return "";
    }
    return getFactionImagePath(activeFaction.name);
  }, [activeFaction]);

  const contractLabel = activeFaction?.contractsCount === 1 ? "contract" : "contracts";
  const activeFactionStyle = {
    borderColor: activeFaction?.colorSurface,
  } as React.CSSProperties;

  if (!activeFaction) {
    return (
      <div className="factions-page-container">
        <div className="factions-empty">No faction data available.</div>
      </div>
    );
  }

  return (
    <div className="factions-page-container">
      <div className="factions-page-content-wrapper scroll-div">
        <section className="factions-section-header">
          <h2 className="factions-section-title">Factions</h2>
          <div className="factions-grid">
            {FACTIONS_DATA.map((faction) => {
              const isActive = faction.factionId === activeFaction.factionId;
              return (
                <button
                  key={faction.id}
                  type="button"
                  className={`factions-card${isActive ? " is-active glitch-rgb" : ""}`}
                  onClick={() => setActiveFactionId(faction.factionId)}
                  style={
                    {
                      "--faction-color": faction.colorSurface,
                      "--faction-on-color": faction.colorOnSurface,
                    } as React.CSSProperties
                  }
                >
                  <img
                    className={`factions-card-icon${isActive ? " glitch-rgb__target" : ""}`}
                    src={getFactionImagePath(faction.name)}
                    alt={faction.name}
                  />
                  <span>{faction.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <header className="factions-header">
          <div className="factions-kicker">Faction</div>
          <div className="factions-title-row">
            <div
              className="factions-icon"
              style={
                {
                  "--faction-color": activeFaction.colorSurface,
                  "--faction-icon-mask": `url("${activeFactionMaskPath}")`,
                } as React.CSSProperties
              }
            />
            <div>
              <h1 className="factions-title">{activeFaction.name}</h1>
              <p className="factions-subtitle">{activeFaction.headline}</p>
              <p className="factions-agent">{activeFaction.agentName}</p>
            </div>
          </div>
          <p className="factions-description">{activeFaction.description}</p>
          <div className="factions-stats">
            <span>{activeFaction.contractsCount} {contractLabel}</span>
            <span>{activeFaction.upgradesCount} upgrades</span>
            <span>{activeFaction.optimizationsCount} optimizations</span>
          </div>
        </header>

        <section className="factions-section">
          <h2 className="factions-section-title">About {activeFaction.name}</h2>
          <p className="factions-muted">{activeFaction.about}</p>
        </section>

        <section className="factions-section">
          <h2 className="factions-section-title">Faction Perks</h2>
          <div className="factions-perks-grid">
            {activeFaction.perks.map((perk) => (
              <article
                key={perk.title}
                className="factions-perk-card"
                style={{ borderColor: `${activeFaction.colorSurface}66` }}
              >
                <h3>{perk.title}</h3>
                <p>{perk.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* <section className="factions-section">
          <h2 className="factions-section-title">Contracts</h2>
          <p className="factions-muted">
            Contracts for {activeFaction.name} will be available at launch. Check back soon.
          </p>
        </section> */}
      </div>
    </div>
  );
};
