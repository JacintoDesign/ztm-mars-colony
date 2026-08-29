export interface TelemetryReadoutData {
  tick: number;
  oxygen: number;
  power: number;
  signedInAccount?: string;
  colonyOwner?: string;
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
    this.container.innerHTML = `<div>tick: ${data.tick}</div><div>oxygen: ${data.oxygen}</div><div>power: ${data.power}</div><div>signed-in account: ${signedIn}</div><div>colony owner: ${owner}</div>`;
  }
}
