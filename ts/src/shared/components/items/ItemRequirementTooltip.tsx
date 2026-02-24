import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { dispatchDesktopNavigation } from "../../services/NavigationEvents";

type RequirementEntry = {
  kind: "quest" | "hideout";
  id: string;
  name: string;
  amount: number;
  state: "active" | "inactive" | "completed";
  traderId?: string;
  stationId?: string;
  level?: number;
};

type ItemRequirementTooltipProps = {
  itemId: string;
  includeQuests: boolean;
  includeHideout: boolean;
  children: React.ReactNode;
};

export const ItemRequirementTooltip: React.FC<ItemRequirementTooltipProps> = ({
  itemId,
  includeQuests,
  includeHideout,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [requirements, setRequirements] = useState<RequirementEntry[]>([]);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const stateLabel = useMemo(
    () => ({
      active: "Active",
      inactive: "Inactive",
      completed: "Completed",
    }),
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    const data = bridge?.getItemRequirementDetails?.(itemId, {
      includeQuests,
      includeHideout,
    }) as RequirementEntry[] | undefined;
    setRequirements(data ?? []);
  }, [isOpen, itemId, includeQuests, includeHideout]);

  const updatePosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) {
      return;
    }
    const anchorRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const spacing = 8;
    let nextPlacement: "top" | "bottom" = "bottom";
    let top = anchorRect.bottom + spacing;
    if (
      top + tooltipRect.height > window.innerHeight &&
      anchorRect.top - spacing - tooltipRect.height >= 0
    ) {
      nextPlacement = "top";
      top = anchorRect.top - spacing - tooltipRect.height;
    }
    const maxLeft = Math.max(8, window.innerWidth - tooltipRect.width - 8);
    const left = Math.min(Math.max(8, anchorRect.left), maxLeft);
    setPlacement(nextPlacement);
    setPosition({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    updatePosition();
  }, [isOpen, requirements, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleUpdate = () => updatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen || !isPinned) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        containerRef.current &&
        tooltipRef.current &&
        !containerRef.current.contains(target) &&
        !tooltipRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsPinned(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isPinned]);

  return (
    <div
      ref={containerRef}
      className="item-requirement-tooltip-container"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!isPinned && !isHoveringTooltip) {
          setIsOpen(false);
        }
      }}
    >
      <div
        className="item-requirement-trigger"
        onClick={() => {
          setIsPinned((prev) => !prev);
          setIsOpen(true);
        }}
      >
        {children}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`item-requirement-tooltip${placement === "top" ? " is-top" : ""}`}
            style={{ top: position.top, left: position.left }}
            onMouseEnter={() => setIsHoveringTooltip(true)}
            onMouseLeave={() => {
              setIsHoveringTooltip(false);
              if (!isPinned) {
                setIsOpen(false);
              }
            }}
          >
            {requirements.length === 0 ? (
              <div className="item-requirement-empty">No requirements.</div>
            ) : (
              requirements.map((entry) => (
                <button
                  key={`${entry.kind}-${entry.id}`}
                  type="button"
                  className="item-requirement-row item-requirement-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (entry.kind === "quest") {
                      dispatchDesktopNavigation({ pageId: "quests", questId: entry.id });
                      return;
                    }
                    dispatchDesktopNavigation({
                      pageId: "hideout",
                      stationId: entry.stationId,
                      levelId: entry.id,
                    });
                  }}
                >
                  <div className="item-requirement-icon">
                    {entry.kind === "hideout" ? (
                      <img src="../img/hideout.png" alt="" />
                    ) : (
                      <img src="../img/side-nav-quest-icon.png" alt="" />
                    )}
                  </div>
                  <div className="item-requirement-name">{entry.name}</div>
                  <div className="item-requirement-amount">x{entry.amount}</div>
                  <div className={`item-requirement-state is-${entry.state}`}>
                    {stateLabel[entry.state]}
                  </div>
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};
