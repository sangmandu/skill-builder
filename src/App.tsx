import { useState, useCallback, useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from './components/FlowCanvas';
import { Toolbar } from './components/panels/Toolbar';
import { LeftSidebar } from './components/panels/LeftSidebar';
import { StepDetailPanel } from './components/panels/StepDetailPanel';
import { AddStepDialog } from './components/panels/AddStepDialog';
import { useWorkflowStore } from './lib/store';
import { X } from 'lucide-react';

const DEFAULT_PRESET_ID = 'full-pipeline';

export default function App() {
  const store = useWorkflowStore();
  const queryRootLoadedRef = useRef(false);
  const [activeTrackPreference, setActiveTrackPreference] = useState<string | null | undefined>();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showAddStep, setShowAddStep] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const activeTrack = activeTrackPreference === undefined
    ? store.tracks[0]?.name ?? null
    : store.tracks.some(t => t.name === activeTrackPreference)
      ? activeTrackPreference
      : null;

  const handleTrackSelect = useCallback((name: string) => {
    setActiveTrackPreference(name);
  }, []);

  const handleStepSelect = useCallback((key: string) => {
    setSelectedStep(key);
  }, []);

  const handleLoadDefaultPreset = useCallback(() => {
    setSelectedStep(null);
    setActiveTrackPreference(undefined);
    setShowNewDialog(false);
    void store.loadPreset(DEFAULT_PRESET_ID);
  }, [store]);

  const handleCreateScratch = useCallback(() => {
    setSelectedStep(null);
    setActiveTrackPreference(null);
    setShowNewDialog(false);
    store.createScratch();
  }, [store]);

  const handleNew = useCallback(async () => {
    const hasExistingWork = store.workspaceStarted || store.steps.length > 0 || Boolean(store.rootDir);
    if (!hasExistingWork) {
      setShowNewDialog(true);
      return;
    }

    if (store.dirty && store.rootDir) {
      const shouldSave = window.confirm('Save current changes before creating a new workflow?');
      if (shouldSave) {
        const result = await store.syncNow();
        if (!result) {
          alert('Save did not complete. Resolve validation or sync issues before creating a new workflow.');
          return;
        }
      } else if (!window.confirm('Create a new workflow without saving current changes?')) {
        return;
      }
    } else if (store.dirty) {
      if (!window.confirm('Current workflow is not exported yet. Create a new workflow without saving it?')) {
        return;
      }
    } else if (!window.confirm('Close the current workflow and create a new one?')) {
      return;
    }

    setShowNewDialog(true);
  }, [store]);

  const showWelcome = !store.workspaceStarted && store.steps.length === 0;

  useEffect(() => {
    if (queryRootLoadedRef.current) return;
    queryRootLoadedRef.current = true;
    const rootDir = new URLSearchParams(window.location.search).get('rootDir');
    if (rootDir) {
      void store.loadFromDir(rootDir);
    }
  }, [store]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-slate-950">
        <Toolbar
          store={store}
          onAddStep={() => setShowAddStep(true)}
          onNew={() => void handleNew()}
        />

        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar
            store={store}
            activeTrack={activeTrack}
            onTrackSelect={handleTrackSelect}
            onStepSelect={handleStepSelect}
            selectedStep={selectedStep}
          />

          <div className="flex-1 relative">
            {showWelcome ? (
              <EmptyState
                onLoadPreset={handleLoadDefaultPreset}
                onScratch={handleCreateScratch}
              />
            ) : (
              <FlowCanvas
                store={store}
                activeTrack={activeTrack}
                onStepSelect={handleStepSelect}
              />
            )}
          </div>

          {selectedStep && (
            <StepDetailPanel
              key={selectedStep}
              store={store}
              stepKey={selectedStep}
              activeTrack={activeTrack}
              onClose={() => setSelectedStep(null)}
            />
          )}
        </div>
      </div>

      {showAddStep && (
        <AddStepDialog store={store} activeTrack={activeTrack} onClose={() => setShowAddStep(false)} />
      )}
      {showNewDialog && (
        <NewWorkflowDialog
          onLoadPreset={handleLoadDefaultPreset}
          onScratch={handleCreateScratch}
          onClose={() => setShowNewDialog(false)}
        />
      )}
    </ReactFlowProvider>
  );
}

function EmptyState({
  onLoadPreset,
  onScratch,
}: {
  onLoadPreset: () => void;
  onScratch: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-16 h-16 rounded-lg bg-violet-950/45 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-2 text-gray-100">Build Your Skill Workflow</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-md">
        Choose a workflow seed to start building the skill structure.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onLoadPreset}
          className="px-4 py-2 bg-violet-700 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors"
        >
          Preset
        </button>
        <button
          onClick={onScratch}
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Scratch
        </button>
      </div>
    </div>
  );
}

function NewWorkflowDialog({
  onLoadPreset,
  onScratch,
  onClose,
}: {
  onLoadPreset: () => void;
  onScratch: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-100">New Workflow</h2>
            <p className="mt-1 text-xs text-gray-400">Choose how to start this skill workflow.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onLoadPreset}
            className="rounded-lg border border-violet-500/40 bg-violet-700 px-4 py-5 text-sm font-medium text-white hover:bg-violet-600"
          >
            Preset
          </button>
          <button
            type="button"
            onClick={onScratch}
            className="rounded-lg border border-gray-700 px-4 py-5 text-sm font-medium text-gray-200 hover:bg-gray-900"
          >
            Scratch
          </button>
        </div>
      </div>
    </div>
  );
}
