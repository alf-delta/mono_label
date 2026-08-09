interface WorkflowHeaderProps {
  step: string;
  onStartOver?: () => void;
}

export function WorkflowHeader({ step, onStartOver }: WorkflowHeaderProps) {
  return (
    <header className="topbar">
      <a className="wordmark" href="/" aria-label="Monoblend Label Studio home">
        <span className="wordmark-mark" aria-hidden="true">M</span>
        <span>MONOBLEND</span>
      </a>
      <div className="topbar-title">
        <span className="eyebrow">Label Studio</span>
        <span className="milestone">Print workflow · M7</span>
      </div>
      {onStartOver ? <button type="button" className="topbar-action" onClick={onStartOver}>{step}</button> : <span />}
    </header>
  );
}
