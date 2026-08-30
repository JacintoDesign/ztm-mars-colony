export interface GameOverModalHandlers {
  onRestart: () => Promise<void>;
}

export class GameOverModal {
  private container: HTMLElement;
  private handlers: GameOverModalHandlers;

  constructor(handlers: GameOverModalHandlers) {
    this.handlers = handlers;
    this.container = document.createElement('div');
    this.container.id = 'game-over-screen';
    this.container.className = 'game-over-screen';
    this.container.style.display = 'none';
    document.body.appendChild(this.container);
  }

  public show(solsSurvived: number, bestSolsSurvived: number): void {
    this.container.style.display = 'flex';
    this.render(solsSurvived, bestSolsSurvived);
  }

  public hide(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }

  private render(solsSurvived: number, bestSolsSurvived: number): void {
    this.container.innerHTML = `
      <div class="game-over-panel">
        <div class="game-over-header">// MISSION TERMINATED - COLONY LIFE SUPPORT COLLAPSE</div>
        <div class="game-over-sub">TELEMETRY ARCHIVE LOG RECORDED</div>

        <div class="game-over-metrics">
          <div class="game-over-metric-row">
            <span class="game-over-metric-label">SOLS SURVIVED THIS RUN:</span>
            <span class="game-over-metric-val" id="sols-this-run">${solsSurvived}</span>
          </div>
          <div class="game-over-metric-row">
            <span class="game-over-metric-label">ACCOUNT PERSONAL BEST:</span>
            <span class="game-over-metric-val" id="best-sols-survived">${bestSolsSurvived} SOLS</span>
          </div>
        </div>

        <button type="button" id="restart-colony-btn" class="game-over-restart-btn">
          START NEW COLONY
        </button>
      </div>
    `;

    const restartBtn = this.container.querySelector<HTMLButtonElement>('#restart-colony-btn');
    restartBtn?.addEventListener('click', async () => {
      if (restartBtn) restartBtn.disabled = true;
      await this.handlers.onRestart();
    });
  }
}
