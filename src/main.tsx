import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WorkflowApp } from './workflow/WorkflowApp';
import './app/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkflowApp />
  </StrictMode>,
);
