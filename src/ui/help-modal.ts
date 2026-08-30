import { CONTRACT_RULES } from '../simulation/contract-rules';

export class HelpModal {
  private affordanceBtn: HTMLButtonElement;
  private modalOverlay: HTMLElement;
  private isOpen: boolean = false;

  public static readonly AFFORDANCE_ID = 'help-btn';
  public static readonly MODAL_ID = 'help-modal';

  constructor() {
    // 1. Create bottom-right '?' affordance button
    let btn = document.getElementById(HelpModal.AFFORDANCE_ID) as HTMLButtonElement | null;
    if (!btn) {
      btn = document.createElement('button');
      btn.id = HelpModal.AFFORDANCE_ID;
      btn.className = 'help-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Open Colony Mission Help');
      btn.textContent = '?';
      document.body.appendChild(btn);
    }
    this.affordanceBtn = btn;

    // 2. Create Modal Overlay container
    let overlay = document.getElementById(HelpModal.MODAL_ID);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = HelpModal.MODAL_ID;
      overlay.className = 'help-modal-overlay';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);
    }
    this.modalOverlay = overlay;

    this.bindEvents();
    this.render();
  }

  /**
   * Sets current active user and handles auto-opening on first load for that user.
   */
  public handleUserSession(userId: string | null): void {
    if (!userId) return;

    const storageKey = `marscolony_help_seen_${userId}`;
    const hasSeen = localStorage.getItem(storageKey);
    if (!hasSeen) {
      this.open();
      localStorage.setItem(storageKey, 'true');
    }
  }

  public open(): void {
    this.isOpen = true;
    this.modalOverlay.style.display = 'flex';
    this.affordanceBtn.classList.add('active');
  }

  public close(): void {
    this.isOpen = false;
    this.modalOverlay.style.display = 'none';
    this.affordanceBtn.classList.remove('active');
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private bindEvents(): void {
    this.affordanceBtn.addEventListener('click', () => {
      this.toggle();
    });

    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  private render(): void {
    const { buildings, colonists, arrivals, ticksPerSol, starting, pools } = CONTRACT_RULES;

    this.modalOverlay.innerHTML = `
      <div class="help-modal-panel">
        <div class="help-modal-header">
          <div>
            <div class="help-modal-title">// MISSION OPERATIONS MANUAL</div>
            <div class="help-modal-subtitle">CONTRACT TELEMETRY DIRECTIVES & SPECIFICATIONS</div>
          </div>
          <button type="button" class="help-modal-close-btn" id="help-close-btn" aria-label="Close Manual">[X] DISMISS</button>
        </div>

        <div class="help-modal-content">
          <!-- Section 1: Survival Goal -->
          <div class="help-section">
            <div class="help-section-title">1. SURVIVAL OBJECTIVE</div>
            <div class="help-section-body">
              <p>Maintain continuous life support on the surface of Mars. A colony starts with ${starting.oxygen} oxygen, ${starting.power} power, and an underground reserve of ${starting.oreReserve} ore.</p>
              <p>Oxygen and Power operate as finite pools (${pools.oxygenMin}–${pools.powerMax}). If either Oxygen OR Power reaches ${pools.oxygenMin} at the end of a tick, every colonist sustains ${colonists.healthDamagePerTick} health damage. When life support is maintained, colonists recover ${colonists.healthRecoveryPerTick} health per tick up to ${colonists.maxHealth}.</p>
              <p>If all colonists perish, the colony status becomes <strong>GAME OVER</strong>. Sols survived is derived directly from the tick counter (${ticksPerSol} ticks = 1 Sol).</p>
            </div>
          </div>

          <!-- Section 2: Building Specs & Costs -->
          <div class="help-section">
            <div class="help-section-title">2. STRUCTURE COSTS & OPERATIONAL EFFECTS</div>
            <div class="help-buildings-grid">
              
              <div class="help-building-card">
                <div class="help-building-header">
                  <span class="help-b-name">${buildings.habitat.name.toUpperCase()}</span>
                  <span class="help-b-cost">COST: ${buildings.habitat.cost.power} PWR</span>
                </div>
                <div class="help-b-desc">${buildings.habitat.description}</div>
                <div class="help-b-specs">
                  <div class="help-spec-line"><span class="spec-k">CAPACITY:</span> <span class="spec-v">${buildings.habitat.capacity} Colonists</span></div>
                  <div class="help-spec-line"><span class="spec-k">POWER DRAW:</span> <span class="spec-v">-${buildings.habitat.powerDraw} PWR / tick</span></div>
                </div>
              </div>

              <div class="help-building-card">
                <div class="help-building-header">
                  <span class="help-b-name">${buildings.solar.name.toUpperCase()}</span>
                  <span class="help-b-cost">COST: ${buildings.solar.cost.power} PWR</span>
                </div>
                <div class="help-b-desc">${buildings.solar.description}</div>
                <div class="help-b-specs">
                  <div class="help-spec-line"><span class="spec-k">OUTPUT:</span> <span class="spec-v">+${buildings.solar.powerProduction} PWR / tick</span></div>
                  <div class="help-spec-line"><span class="spec-k">POWER DRAW:</span> <span class="spec-v">${buildings.solar.powerDraw} PWR / tick</span></div>
                </div>
              </div>

              <div class="help-building-card">
                <div class="help-building-header">
                  <span class="help-b-name">${buildings.scrubber.name.toUpperCase()}</span>
                  <span class="help-b-cost">COST: ${buildings.scrubber.cost.power} PWR, ${buildings.scrubber.cost.ore} ORE</span>
                </div>
                <div class="help-b-desc">${buildings.scrubber.description}</div>
                <div class="help-b-specs">
                  <div class="help-spec-line"><span class="spec-k">OUTPUT:</span> <span class="spec-v">+${buildings.scrubber.oxygenProduction} O2 / tick</span></div>
                  <div class="help-spec-line"><span class="spec-k">POWER DRAW:</span> <span class="spec-v">-${buildings.scrubber.powerDraw} PWR / tick</span></div>
                </div>
              </div>

              <div class="help-building-card">
                <div class="help-building-header">
                  <span class="help-b-name">${buildings.extractor.name.toUpperCase()}</span>
                  <span class="help-b-cost">COST: ${buildings.extractor.cost.power} PWR</span>
                </div>
                <div class="help-b-desc">${buildings.extractor.description}</div>
                <div class="help-b-specs">
                  <div class="help-spec-line"><span class="spec-k">OUTPUT:</span> <span class="spec-v">+${buildings.extractor.oreProduction} ORE / tick (depletes reserve)</span></div>
                  <div class="help-spec-line"><span class="spec-k">POWER DRAW:</span> <span class="spec-v">-${buildings.extractor.powerDraw} PWR / tick</span></div>
                </div>
              </div>

            </div>
          </div>

          <!-- Section 3: Colonist Arrival Rules -->
          <div class="help-section">
            <div class="help-section-title">3. COLONIST ARRIVAL & LOGISTICS</div>
            <div class="help-section-body">
              <p>A transport ship lands every <strong>${arrivals.intervalTicks} ticks</strong>, deploying <strong>${arrivals.colonistsPerShip} colonist</strong> at the landing zone tile (${arrivals.landingTile.x}, ${arrivals.landingTile.y}).</p>
              <p>Arrivals occur only if total colony population is below habitat capacity (${buildings.habitat.capacity} colonists per Habitat). If capacity is full, no landing occurs.</p>
              <p>Each active colonist continuously consumes <strong>${colonists.oxygenConsumptionPerTick} Oxygen per tick</strong>. Newly-landed colonists deterministically pathfind to the nearest available habitat with open capacity.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.modalOverlay.querySelector<HTMLButtonElement>('#help-close-btn');
    closeBtn?.addEventListener('click', () => {
      this.close();
    });
  }
}
