import { Building } from '../simulation/types';

export interface TelemetryReadoutData {
  tick: number;
  oxygen: number;
  power: number;
  ore: number;
  signedInAccount?: string;
  colonyOwner?: string;
  buildings?: Building[];
  lastAppliedTick?: string;
}

export class InternalReadout {
  private container: HTMLElement | null = null;
  public static readonly CONTAINER_ID = 'internal-readout';

  constructor() {
    this.container = document.getElementById(InternalReadout.CONTAINER_ID);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = InternalReadout.CONTAINER_ID;
      document.body.appendChild(this.container);
    }
  }

  public update(data: TelemetryReadoutData): void {
    if (!this.container) return;
    const signedIn = data.signedInAccount ?? 'none';
    const owner = data.colonyOwner ?? 'none';
    const lastTick = data.lastAppliedTick ?? 'Never';

    let buildingsHtml: string;
    if (!data.buildings || data.buildings.length === 0) {
      buildingsHtml = '<div>buildings: none</div>';
    } else {
      const rows = data.buildings
        .map((b) => `<div class="readout-building-item">  - ${b.type} (${b.x}, ${b.y})</div>`)
        .join('');
      buildingsHtml = `<div>buildings:</div><div class="readout-buildings-list">${rows}</div>`;
    }

    this.container.innerHTML = `<div>tick: ${data.tick}</div><div>oxygen: ${data.oxygen}</div><div>power: ${data.power}</div><div>ore: ${data.ore}</div><div>signed-in account: ${signedIn}</div><div>colony owner: ${owner}</div>${buildingsHtml}<div>last applied tick: ${lastTick}</div>`;
  }
}
