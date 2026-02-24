import React, { useEffect, useMemo, useState } from "react";
import { I18nHelper } from "../../../locale/I18nHelper";
import {
  StorePackage,
} from "../../../background/services/tebex/store-packages-service";
import { SubscriptionStatus } from "../../../background/services/tebex/subscription-status-service";
import { useUserStatusContext } from "../../context/UserStatusContext";
import "./subscription.css";

type SubscriptionBridge = {
  waitForSubscriptionPackages?: () => Promise<void>;
  getSubscriptionPackages?: () => StorePackage[];
  requestSubscriptionCheckout?: (packageId: number) => void;
  openSubscriptionManage?: () => void;
  onSubscriptionStatusChanged?: (handler: (status: SubscriptionStatus) => void) => () => void;
  getSubscriptionStatus?: () => SubscriptionStatus;
};

const getBridge = (): SubscriptionBridge | undefined => {
  try {
    const mainWindow = overwolf?.windows?.getMainWindow?.();
    return (mainWindow as any)?.backgroundBridge as SubscriptionBridge | undefined;
  } catch {
    return undefined;
  }
};

const getPriceLabel = (pack: StorePackage): { label: string; monthly?: string; yearly?: boolean } => {
  const name = pack.name.toLowerCase();
  if (name.includes("vip")) {
    return { label: `${pack.base_price}$ / mo` };
  }
  if (name.includes("yearly")) {
    const perMonth = Number(pack.base_price) / 12;
    let monthly: string | undefined;
    if (Number.isFinite(perMonth)) {
      const value = Number.isInteger(perMonth) ? perMonth.toString() : perMonth.toFixed(2);
      monthly = `${value}$ / mo`;
    }
    return { label: `${pack.base_price}$ / year`, monthly, yearly: true };
  }
  if (name.includes("lifetime")) {
    return { label: `${pack.base_price}$ / life` };
  }
  return { label: `${pack.base_price}$` };
};

export const SubscriptionPage: React.FC = () => {
  const { status } = useUserStatusContext();
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [subscriptionOverride, setSubscriptionOverride] =
    useState<SubscriptionStatus | null>(null);
  const bridge = useMemo(getBridge, []);
  const isLoggedIn = status?.user?.isLoggedIn ?? false;
  const subscriptionState = subscriptionOverride?.state ?? status?.subscription?.state;
  const isSubscribed =
    subscriptionState === "ACTIVE" ||
    subscriptionState === "PENDING_CANCELLATION";
  const activePackageId =
    subscriptionOverride?.packageId ?? status?.subscription?.packageId ?? null;
  const plansDisabled = !isLoggedIn;

  useEffect(() => {
    I18nHelper.init().catch((error) => {
      console.warn("[SubscriptionPage] Failed to init i18n:", error);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadPackages = async () => {
      try {
        await bridge?.waitForSubscriptionPackages?.();
        const available = bridge?.getSubscriptionPackages?.() ?? [];
        if (isMounted) {
          setPackages(available);
        }
      } catch (error) {
        console.warn("[SubscriptionPage] Failed to load packages", error);
      }
    };
    loadPackages();
    return () => {
      isMounted = false;
    };
  }, [bridge]);

  useEffect(() => {
    if (!bridge?.onSubscriptionStatusChanged) {
      return;
    }
    const unsubscribe = bridge.onSubscriptionStatusChanged((nextStatus) => {
      setSubscriptionOverride(nextStatus);
    });
    const initialStatus = bridge.getSubscriptionStatus?.();
    if (initialStatus) {
      setSubscriptionOverride(initialStatus);
    }
    return () => {
      unsubscribe?.();
    };
  }, [bridge]);

  useEffect(() => {
    if (isSubscribed && activePackageId) {
      setSelectedPackageId(activePackageId);
      return;
    }
    if (!isSubscribed) {
      setSelectedPackageId(null);
    }
  }, [activePackageId, isSubscribed]);

  const canSubscribe = isLoggedIn && !isSubscribed && !!selectedPackageId;

  const handleSubscribe = () => {
    if (!canSubscribe || !selectedPackageId) {
      return;
    }
    bridge?.requestSubscriptionCheckout?.(selectedPackageId);
  };

  return (
    <div id="subscription-window-container" className="subscription-page scroll-div">
      <div className="subscription-page-inner">
        <div className="subscription-page-header">
          <img
            className="subscription-page-header-image"
            src="../icons/subscription-button.png"
            alt="Marathon Companion Premium"
          />
          <div className="subscription-page-title">Marathon Companion Premium</div>
          <button
            id="manage-subscription-button"
            className="subscription-button subscription-manage-button"
            type="button"
            onClick={() => bridge?.openSubscriptionManage?.()}
          >
            Manage
          </button>
        </div>

        <div className="subscription-page-body">
          <div className="subscription-hero">
            <img
              className="subscription-hero-image"
              src="../img/subscription/subscription-header.png"
              alt="Marathon Companion Premium"
            />
            <div className="subscription-hero-badge">Unlock companion premium</div>
            <div className="subscription-hero-title">The Ultimate Raider Experience</div>
          </div>

          <div className="subscription-perks">
            <ul className="subscription-perks-list">
              <li className="subscription-perk-item">
                <img
                  className="subscription-bullet-point-image"
                  src="../img/subscription/service_toolbox.png"
                  alt="Service Toolbox"
                />
                <div className="subscription-bullet-point-container">
                  <span className="subscription-bullet-point-header">More Active Trades</span>
                  <span className="subscription-bullet-point-description">Track up to 20 concurrent trades at once for faster progression and better planning.</span>
                </div>
              </li>
              <li className="subscription-perk-item">
                <img
                  className="subscription-bullet-point-image"
                  src="../img/subscription/ad_off.png"
                  alt="Service Toolbox"
                />
                <div className="subscription-bullet-point-container">
                  <span className="subscription-bullet-point-header">Ad-Free Interface</span>
                  <span className="subscription-bullet-point-description">Remove all ads entirely and enjoy a clean, uninterrupted UI while you focus on what matters.</span>
                </div>
              </li>
              <li className="subscription-perk-item">
                <img
                  className="subscription-bullet-point-image"
                  src="../img/subscription/diamond.png"
                  alt="Service Toolbox"
                />
                <div className="subscription-bullet-point-container">
                  <span className="subscription-bullet-point-header">Support Ongoing Development</span>
                  <span className="subscription-bullet-point-description">Help fuel continued updates, new features, and long-term improvements for Marathon Companion.</span>
                </div>
              </li>
            </ul>
          </div>

          <div
            className={`subscription-plans-container${
              plansDisabled ? " subscription-plans-disabled" : ""
            }`}
          >
            {packages.map((pack) => {
              const price = getPriceLabel(pack);
              const isActive = isSubscribed && activePackageId === pack.id;
              const isSelected = selectedPackageId === pack.id;
              const isDisabled = plansDisabled || isSubscribed;
              return (
                <button
                  key={pack.id}
                  type="button"
                  className={`subscription-plan${price.yearly ? " sub-yearly" : ""}${
                    isActive ? " sub-active" : ""
                  }${isSelected ? " sub-selected" : ""}${isDisabled ? " sub-deactivated" : ""}`}
                  onClick={() => {
                    if (!isSubscribed && !plansDisabled) {
                      setSelectedPackageId(pack.id);
                    }
                  }}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                >
                  <div className="subscription-best-value-badge">Best Value</div>
                  <div className="image-header-container">
                    <div className="sub-title-container">
                      <b className="sub-title">{pack.name}</b>
                    </div>
                  </div>
                  <div className="sub-price-container">
                    <div className={`sub-price-month${price.monthly ? " sub-price-month-visible" : ""}`}>
                      {price.monthly ?? ""}
                    </div>
                    <b className="sub-price">{price.label}</b>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="subscription-footer">
          <div className="subscription-status-block">
            {/* <div id="sub-header" className="subscription-status-header">
              Subscribe to get rid of ads
            </div> */}
            <div className="subscription-login-row">
              <span id="currentlyLoggedInAs" className="subscription-login-label">
                Currently Logged in as{" "}
              </span>
              <span
                id="loggedIn"
                className={`subscription-login-value ${
                  isLoggedIn ? "loggedIn" : "not-logged-in-text"
                }`}
              >
                {status?.user?.displayName ?? "Not logged in to Overwolf"}
              </span>
            </div>
            <div className="subscription-status-row">
              <span id="subscriptionStatusText" className="subscription-status-label">
                Subscription Status:{" "}
              </span>
              <span
                id="current-subscription-status"
                className={`current-subscription-text${
                  subscriptionState === "ACTIVE" ? " subscription-status-active" : ""
                }`}
              >
                {subscriptionState ?? "NONE"}
              </span>
            </div>
          </div>
            <button
              id="subscribe-button"
              className="subscribe-button subscription-cta-button"
              type="button"
              onClick={handleSubscribe}
              disabled={!canSubscribe}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
