import { useEffect, useId, useRef } from "react";
import { PetKind } from "../lib/types";
import { getPetArt, ROOT_PART } from "../lib/petArt";
import { AnimationDriver } from "../lib/animations/driver";

interface PetViewProps {
  pet: PetKind;
  animation: string;
  energy: number;
  flipX: boolean;
  size: number;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function PetView({
  pet,
  animation,
  energy,
  flipX,
  size,
  onContextMenu,
  onMouseDown,
}: PetViewProps) {
  const rootRef = useRef<SVGGElement | null>(null);
  const driverRef = useRef<AnimationDriver | null>(null);
  const uid = useId().replace(/:/g, "");

  const art = getPetArt(pet);
  const vbW = Number(art.viewBox.split(" ")[2]) || 120;
  const flipTransform = flipX ? `translate(${vbW} 0) scale(-1 1)` : undefined;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const map = new Map<string, SVGElement>();
    map.set(ROOT_PART, root);
    root.querySelectorAll("[data-part]").forEach((el) => {
      const name = el.getAttribute("data-part");
      if (name) map.set(name, el as SVGElement);
    });
    const driver = new AnimationDriver({
      getPivot: (part) => {
        if (part === ROOT_PART) return art.rootPivot;
        return art.partPivots[part];
      },
    });
    driver.bind(map);
    driver.start();
    driverRef.current = driver;
    return () => {
      driver.stop();
      driverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet]);

  useEffect(() => {
    driverRef.current?.setAnimation(animation, energy);
  }, [animation, energy, pet]);

  return (
    <svg
      viewBox={art.viewBox}
      width={size}
      height={size}
      style={{
        display: "block",
        cursor: "grab",
        overflow: "visible",
      }}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
    >
      <ellipse cx={vbW / 2} cy={126} rx={vbW * 0.26} ry={5} fill="rgba(0,0,0,0.22)" />
      <g transform={flipTransform}>
        <g ref={rootRef}>{art.render(uid)}</g>
      </g>
    </svg>
  );
}
