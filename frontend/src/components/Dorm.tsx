import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AVATAR_ITEMS } from '../assets/manifest';
import { ItemId, SpotId } from '../domain/items';
import { AccessoryId, HeldPropId } from '../domain/gear';
import { InventoryPanel } from './InventoryPanel';
import { DormScene } from './room/DormScene';
import { parseStandUpDraft } from '../domain/standUp';
import { JourneyStep } from '../domain/selectors';

export interface DormProps {
  xp: number;
  xpPulse: number;
  journeyStep: JourneyStep | null;
  onJourneyNavigate: (step: Exclude<JourneyStep, 'standup'>) => void;
  standUpSubmitted: boolean;
  standUpToday: boolean;
  standUpBusy: boolean;
  standUpError: string | null;
  standUpReady: boolean;
  onRetryStandUps: () => void;
  standUpDraft: string;
  onSubmitStandUp: (bullet1: string, bullet2: string) => void;
  onStandUpDraftChange: (draft: string) => void;
  avatarItem: string;
  accessory: AccessoryId | null;
  heldProp: HeldPropId | null;
  onSelectAccessory: (itemId: AccessoryId | null) => void;
  onSelectHeldProp: (itemId: HeldPropId | null) => void;
  roomItems: string[];
  onSelectAvatar: (itemId: string) => void;
  onToggleRoomItem: (itemId: string) => void;
  unlockedItemIds: ItemId[];
  placements: Partial<Record<SpotId, ItemId>>;
  onPlaceItem: (itemId: ItemId, spotId: SpotId) => void;
  onRemoveItem: (spotId: SpotId) => void;
}

/**
 * Dorm screen (F1): internship XP bar, walkable room with a briefcase button
 * (top-right) that opens the inventory of avatar looks and toggled decor,
 * journey guidance, and the optional two-bullet stand-up.
 */
export function Dorm({
  xp,
  xpPulse,
  journeyStep,
  onJourneyNavigate,
  standUpSubmitted,
  standUpToday,
  standUpBusy,
  standUpError,
  standUpReady,
  onRetryStandUps,
  standUpDraft,
  onSubmitStandUp,
  onStandUpDraftChange,
  avatarItem,
  accessory,
  heldProp,
  onSelectAccessory,
  onSelectHeldProp,
  roomItems,
  onSelectAvatar,
  onToggleRoomItem,
  unlockedItemIds,
  placements,
  onPlaceItem,
  onRemoveItem,
}: DormProps) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [carryingId, setCarryingId] = useState<ItemId | null>(null);
  const [isStandUpOpen, setIsStandUpOpen] = useState(false);
  const standUpPanelRef = useRef<HTMLElement>(null);
  const { win, nextStep } = parseStandUpDraft(standUpDraft);
  const updateDraft = (values: { win: string; nextStep: string }) => onStandUpDraftChange(JSON.stringify(values));

  useEffect(() => { if (standUpToday) setIsStandUpOpen(false); }, [standUpToday]);
  useEffect(() => {
    if (isStandUpOpen) standUpPanelRef.current?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }, [isStandUpOpen]);

  const avatarEntry = AVATAR_ITEMS.find((item) => item.id === avatarItem);

  return (
    <>
      <header className="dorm-header">
        <h1 className="brand-logo" aria-label="LarpedIn">Larped<span>in</span></h1>
        <div className="card xp-wrap">
          <div className="xp-row">
            <span>Progress toward a tech-bro VC startup internship (with equity)</span>
            <strong>{xp}/100 XP</strong>
          </div>
          <div
            className="xp-bar"
            role="progressbar"
            aria-valuenow={xp}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress toward a tech-bro VC startup internship with equity"
          >
            <div className="xp-fill" style={{ width: `${xp}%` }} />
          </div>
        </div>
      </header>

      {!standUpToday && (
        <div className="standup-entry">
          <button type="button" className="standup-shortcut" aria-expanded={isStandUpOpen}
            aria-controls="dorm-standup" disabled={!standUpReady} onClick={() => setIsStandUpOpen((open) => !open)}>
            <span><strong>What's the update, founder?</strong><small>Your daily Stand-Up{!standUpSubmitted && ' · +5 XP'}</small></span>
            <span aria-hidden>{isStandUpOpen ? '−' : '+'}</span>
          </button>
          {!standUpReady && standUpError && <button type="button" className="btn" onClick={onRetryStandUps}>Retry loading Stand-Ups</button>}
          {!standUpReady && standUpError && <p className="form-error" role="alert">{standUpError}</p>}
        </div>
      )}
      {!standUpToday && isStandUpOpen && (
        <section ref={standUpPanelRef} className="card dorm-standup" id="dorm-standup">
          <h3>Your daily Stand-Up</h3>
          <p className="muted">A little progress report for your very real board of directors.</p>
          <div className="standup-grid">
            <label>What did you ship, learn, or survive?
              <textarea maxLength={500} value={win} placeholder="A win, a lesson, or a close call..." onChange={(e) => updateDraft({ win: e.target.value, nextStep })} />
            </label>
            <label>What's on the roadmap?
              <textarea maxLength={500} value={nextStep} placeholder="Your next move..." onChange={(e) => updateDraft({ win, nextStep: e.target.value })} />
            </label>
          </div>
          <div className="standup-preview" aria-label="Stand-Up post preview">
            <strong>Feed preview</strong>
            {win.trim() && <p>The win: {win.trim()}</p>}
            {nextStep.trim() && <p>Next up: {nextStep.trim()}</p>}
            {!win.trim() && !nextStep.trim() && <p>Your update will appear here.</p>}
          </div>
          {standUpError && <p className="form-error" role="alert">{standUpError}</p>}
          <button type="button" className="btn btn-primary btn-block" disabled={standUpBusy || !(win.trim() || nextStep.trim())}
            onClick={() => onSubmitStandUp(win.trim(), nextStep.trim())}>
            {standUpBusy ? 'Posting…' : 'Post Stand-Up to feed'}
          </button>
        </section>
      )}

      <DormScene
        avatar={avatarEntry ?? AVATAR_ITEMS[0]}
        xpPulse={xpPulse}
        accessory={accessory}
        heldProp={heldProp}
        lightsPlaced={roomItems.includes('rgb-lights')}
        unlockedItemIds={unlockedItemIds}
        placements={placements}
        onPlaceItem={onPlaceItem}
        onRemoveItem={onRemoveItem}
        carryingId={carryingId}
        onCarryItem={setCarryingId}
      >
        {journeyStep && !carryingId && !inventoryOpen && (
          <button type="button" className="journey-banner" onClick={() => {
            if (journeyStep === 'standup') setIsStandUpOpen(true);
            else onJourneyNavigate(journeyStep);
          }}>
            <span><small>UP NEXT</small><strong>{
              journeyStep === 'events' ? 'Find an event' : journeyStep === 'standup' ? 'Post your first Stand-Up' :
              journeyStep === 'camera' ? 'Capture an event photo' : journeyStep === 'social' ? 'Share your post' : 'Create your event post'
            }</strong></span>
            <ArrowRight className="journey-arrow" size={20} aria-hidden="true" />
          </button>
        )}
        <button
          className="dorm-inventory-btn"
          onClick={() => setInventoryOpen(true)}
          aria-label="Open inventory"
          title="Inventory"
        >
          🧳
        </button>
        <InventoryPanel
          open={inventoryOpen}
          avatarItem={avatarItem}
          accessory={accessory}
          heldProp={heldProp}
          xp={xp}
          onSelectAccessory={onSelectAccessory}
          onSelectHeldProp={onSelectHeldProp}
          roomItems={roomItems}
          onSelectAvatar={onSelectAvatar}
          onToggleRoomItem={onToggleRoomItem}
          unlockedItemIds={unlockedItemIds}
          placements={placements}
          onCarryItem={setCarryingId}
          onDropItem={(itemId, x, y) => {
            window.dispatchEvent(new CustomEvent('room-item-drop', { detail: { itemId, x, y } }));
            setInventoryOpen(false);
          }}
          onClose={() => setInventoryOpen(false)}
        />
      </DormScene>
    </>
  );
}
