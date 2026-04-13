import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDatabase, setupBackupLocation } from './infrastructure/database/DatabaseService'

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!);
  root.render(<div style={{ padding: 24, fontFamily: 'system-ui' }}>Loading…</div>);
  await initDatabase();
  await setupBackupLocation();
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
void bootstrap();
