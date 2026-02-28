import React from "react";

type FirstTimeExperienceProps = {
  onComplete?: () => void;
};

export const FirstTimeExperience: React.FC<FirstTimeExperienceProps> = ({ onComplete }) => (
  <div className="first-time-user-screen">
    <div className="first-time-user-background-image-container">
        <img
            className="first-time-user-background-image"
            src="../../img/background/ftue-pitched.png"
            alt=""
        />
    </div>

    <div className="first-time-user-content">
      <div className="first-time-user-header">
        <img
          className="first-time-user-logo"
          src="../../icons/logo-256x256.png"
          alt="Marathon Companion"
        />
      </div>
      <div className="first-time-user-title">
        <span className="first-time-user-subtitle">Welcome to</span>
        <h1 className="first-time-user-name">Marathon Companion</h1>
        <p className="first-time-user-tagline">Your Companion for Smarter, Faster Progression</p>
      </div>
      <div className="first-time-user-cards">
        <div className="first-time-user-card">
          <span
            className="first-time-user-card-icon first-time-user-card-icon-uncommon first-time-user-card-icon-map"
            aria-hidden="true"
          />
          <div className="first-time-user-card-title">Tactical Maps</div>
          <div className="first-time-user-card-description">
            Scout resources, POIs, and enemy zones instantly to plan your route.
          </div>
        </div>
        <div className="first-time-user-card">
          <span
            className="first-time-user-card-icon first-time-user-card-icon-rare first-time-user-card-icon-rubric"
            aria-hidden="true"
          />
          <div className="first-time-user-card-title">Track Your Progress</div>
          <div className="first-time-user-card-description">
            Track your progress through quests, hideout, and items in one place.
          </div>
        </div>
        <div className="first-time-user-card">
          <span
            className="first-time-user-card-icon first-time-user-card-icon-legendary first-time-user-card-icon-trade"
            aria-hidden="true"
          />
          <div className="first-time-user-card-title">Builds & Advanced Stats</div>
          <div className="first-time-user-card-description">
            Dive into advanced stats and build your own runners and weapon loadouts.
          </div>
        </div>
      </div>
      <button
        type="button"
        className="first-time-user-action"
        onClick={onComplete}
      >
        Let's go
      </button>
    </div>
  </div>
);
