export interface ResourcePanelData {
  oxygen: number;
  power: number;
}

export class ResourcePanel {
  private container: HTMLElement;
  public static readonly CONTAINER_ID = 'resource-panel';

  constructor() {
    let el = document.getElementById(ResourcePanel.CONTAINER_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = ResourcePanel.CONTAINER_ID;
      el.className = 'resource-panel';
      document.body.appendChild(el);
    }
    this.container = el;
    this.render({ oxygen: 50, power: 50 });
  }

  public update(data: ResourcePanelData): void {
    this.render(data);
  }

  private getResourceLevel(value: number): 'nominal' | 'warning' | 'critical' {
    if (value <= 0) return 'critical';
    if (value <= 25) return 'warning';
    return 'nominal';
  }

  private render(data: ResourcePanelData): void {
    const o2Val = Math.max(0, Math.min(100, Math.round(data.oxygen)));
    const pwrVal = Math.max(0, Math.min(100, Math.round(data.power)));

    const o2Level = this.getResourceLevel(o2Val);
    const pwrLevel = this.getResourceLevel(pwrVal);

    this.container.innerHTML = `
      <div class="resource-panel-header">// LIFE SUPPORT TELEMETRY</div>
      <div class="resource-row">
        <div class="resource-meta">
          <span class="resource-label">OXYGEN</span>
          <span class="resource-val resource-val-${o2Level}" id="resource-val-oxygen">${o2Val}%</span>
        </div>
        <div class="resource-track" id="resource-track-oxygen">
          <div class="resource-bar resource-bar-${o2Level}" id="resource-bar-oxygen" style="width: ${o2Val}%;"></div>
        </div>
      </div>
      <div class="resource-row">
        <div class="resource-meta">
          <span class="resource-label">POWER</span>
          <span class="resource-val resource-val-${pwrLevel}" id="resource-val-power">${pwrVal}%</span>
        </div>
        <div class="resource-track" id="resource-track-power">
          <div class="resource-bar resource-bar-${pwrLevel}" id="resource-bar-power" style="width: ${pwrVal}%;"></div>
        </div>
      </div>
    `;
  }
}
