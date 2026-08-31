import { CONTRACT_RULES } from '../simulation/contract-rules';

export class HelpModal {
  private affordanceBtn: HTMLButtonElement;
  private modalOverlay: HTMLElement;
  private isOpen: boolean = false;

  public static readonly AFFORDANCE_ID = 'help-btn';
  public static readonly MODAL_ID = 'help-modal';

  constructor() {
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
    const { buildings, colonists, arrivals, ticksPerSol, starting, pools, maintenance, rovers, refinery, asteroids } = CONTRACT_RULES;

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
            <div class="help-section-title">1. SURVIVAL OBJECTIVE & LIFE SUPPORT</div>
            <div class="help-section-body">
              <p>Maintain continuous life support on Mars. A colony starts with ${starting.oxygen} oxygen, ${starting.power} power, ${starting.food} food, and 500 ore distributed across grid deposits.</p>
              <p>Oxygen, Power, and Food are finite pools (${pools.oxygenMin}–${pools.powerMax}). If <strong>Oxygen == 0 OR Power == 0 OR Food == 0</strong> at the end of a tick, every colonist sustains <strong>${colonists.healthDamagePerTick} health damage</strong>. Colonists recover <strong>${colonists.healthRecoveryPerTick} HP/tick</strong> when all 3 pools are nominal.</p>
              <p>Colonists consume <strong>${colonists.oxygenConsumptionPerTick} O2/tick</strong> and <strong>${colonists.foodConsumptionPerTick} Food/tick</strong> each.</p>
              <p>If all colonists perish, the mission ends (<strong>GAME OVER</strong>). Sols survived is derived directly from the tick counter (${ticksPerSol} ticks = 1 Sol).</p>
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
                  <div class="help-spec-line"><span class="spec-k">REPAIR:</span> <span class="spec-v">${buildings.habitat.repairLabor} Colonist, ${buildings.habitat.repairElectronics} Electronics</span></div>
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
                  <div class="help-spec-line"><span class="spec-k">REPAIR:</span> <span class="spec-v">${buildings.solar.repairLabor} Colonist, ${buildings.solar.repairElectronics} Electronics</span></div>
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
                  <div class="help-spec-line"><span class="spec-k">REPAIR:</span> <span class="spec-v">${buildings.scrubber.repairLabor} Colonist, ${buildings.scrubber.repairElectronics} Electronics</span></div>
                </div>
              </div>

              <div class="help-building-card">
                <div class="help-building-header">
                  <span class="help-b-name">${buildings.farm.name.toUpperCase()}</span>
                  <span class="help-b-cost">COST: ${buildings.farm.cost.power} PWR, ${buildings.farm.cost.ore} ORE</span>
                </div>
                <div class="help-b-desc">${buildings.farm.description}</div>
                <div class="help-b-specs">
                  <div class="help-spec-line"><span class="spec-k">OUTPUT:</span> <span class="spec-v">+${buildings.farm.foodProduction} Food / tick</span></div>
                  <div class="help-spec-line"><span class="spec-k">POWER DRAW:</span> <span class="spec-v">-${buildings.farm.powerDraw} PWR / tick</span></div>
                  <div class="help-spec-line"><span class="spec-k">REPAIR:</span> <span class="spec-v">${buildings.farm.repairLabor} Colonist, ${buildings.farm.repairElectronics} Electronics</span></div>
                </div>
              </div>

              <div class="help-building-card">
                <div class="help-building-header">
                  <span class="help-b-name">${buildings.extractor.name.toUpperCase()}</span>
                  <span class="help-b-cost">COST: ${buildings.extractor.cost.power} PWR</span>
                </div>
                <div class="help-b-desc">${buildings.extractor.description}</div>
                <div class="help-b-specs">
                  <div class="help-spec-line"><span class="spec-k">OUTPUT:</span> <span class="spec-v">+${buildings.extractor.oreProduction} ORE / tick (from local tile deposit)</span></div>
                  <div class="help-spec-line"><span class="spec-k">POWER DRAW:</span> <span class="spec-v">-${buildings.extractor.powerDraw} PWR / tick</span></div>
                  <div class="help-spec-line"><span class="spec-k">REPAIR:</span> <span class="spec-v">${buildings.extractor.repairLabor} Colonists, ${buildings.extractor.repairElectronics} Electronics</span></div>
                </div>
              </div>

              <div class="help-building-card">
                <div class="help-building-header">
                  <span class="help-b-name">${buildings.garage.name.toUpperCase()}</span>
                  <span class="help-b-cost">COST: ${buildings.garage.cost.power} PWR, ${buildings.garage.cost.ore} ORE</span>
                </div>
                <div class="help-b-desc">${buildings.garage.description}</div>
                <div class="help-b-specs">
                  <div class="help-spec-line"><span class="spec-k">CAPACITY:</span> <span class="spec-v">${rovers.maxRoversPerGarage} Surface Rovers</span></div>
                  <div class="help-spec-line"><span class="spec-k">POWER DRAW:</span> <span class="spec-v">-${buildings.garage.powerDraw} PWR / tick</span></div>
                  <div class="help-spec-line"><span class="spec-k">REPAIR:</span> <span class="spec-v">${buildings.garage.repairLabor} Colonists, ${buildings.garage.repairElectronics} Electronics</span></div>
                </div>
              </div>

              <div class="help-building-card">
                <div class="help-building-header">
                  <span class="help-b-name">${buildings.refinery.name.toUpperCase()}</span>
                  <span class="help-b-cost">COST: ${buildings.refinery.cost.power} PWR, ${buildings.refinery.cost.ore} ORE</span>
                </div>
                <div class="help-b-desc">${buildings.refinery.description}</div>
                <div class="help-b-specs">
                  <div class="help-spec-line"><span class="spec-k">CAPACITY:</span> <span class="spec-v">${refinery.maxCellCapacity} Battery Cells</span></div>
                  <div class="help-spec-line"><span class="spec-k">POWER DRAW:</span> <span class="spec-v">-${buildings.refinery.powerDraw} PWR / tick</span></div>
                  <div class="help-spec-line"><span class="spec-k">REPAIR:</span> <span class="spec-v">${buildings.refinery.repairLabor} Colonists, ${buildings.refinery.repairElectronics} Electronics</span></div>
                </div>
              </div>

            </div>
          </div>

          <!-- Section 3: Maintenance & Weather -->
          <div class="help-section">
            <div class="help-section-title">3. BUILDING CONDITION, WEATHER & REPAIRS</div>
            <div class="help-section-body">
              <p>Operational buildings have a <strong>1-in-15,000 chance per tick</strong> of suffering a mechanical failure (<strong>broken</strong>). Broken structures produce and draw nothing until repaired (${maintenance.repairDurationTicks} consecutive ticks on-site with required colonists and electronics).</p>
              <p>Every <strong>${maintenance.dustStormWindowTicks} ticks</strong>, Martian dust storms roll in (<strong>20% probability</strong>), burying up to 3 structures. Buried buildings require <strong>1 colonist for ${maintenance.digOutDurationTicks} ticks to dig out (zero resource cost)</strong> before they can resume operation or be repaired.</p>
            </div>
          </div>

          <!-- Section 4: Colonist Aging -->
          <div class="help-section">
            <div class="help-section-title">4. COLONIST LIFESPAN & AGING</div>
            <div class="help-section-body">
              <p>Each colonist has an individual seeded lifespan between <strong>${colonists.minLifespanTicks.toLocaleString()} and ${colonists.maxLifespanTicks.toLocaleString()} ticks</strong> (12–18 Sols). Colonists show visibly greyed hair past 75% of their lifespan and perish of natural old age upon reaching their lifespan ceiling.</p>
            </div>
          </div>

          <!-- Section 5: Escorted Arrivals & Electronics -->
          <div class="help-section">
            <div class="help-section-title">5. ESCORTED SHIP ARRIVALS & ELECTRONICS</div>
            <div class="help-section-body">
              <p>Transport ships land every <strong>${arrivals.intervalTicks} ticks</strong> delivering 1 colonist and <strong>${arrivals.electronicsPerShip} Electronics</strong> to landing zone (0, 0).</p>
              <p>A rover must be dispatched to escort the arrival within a <strong>${arrivals.escortWindowTicks}-tick window</strong>. If unescorted, the arrival is permanently lost.</p>
            </div>
          </div>

          <!-- Section 6: Rovers, Batteries & Asteroids -->
          <div class="help-section">
            <div class="help-section-title">6. ROVERS, REFINERY & ASTEROIDS</div>
            <div class="help-section-body">
              <p>Rovers travel at <strong>${rovers.speedTilesPerTick} tiles/tick</strong> and consume <strong>${rovers.powerDrainPerTick} PWR/tick</strong> on missions. Dispatching a rover requires <strong>1 Battery Cell</strong> (refined at the Refinery for ${refinery.oreCostPerCell} ore).</p>
              <p>Stored battery cells decay by <strong>-1 efficiency/tick</strong>. Active asteroids spawn periodically (~${asteroids.spawnWindowTicks} ticks) for ${asteroids.lifetimeTicks} ticks with rich ore deposits accessible by rover dispatch.</p>
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
