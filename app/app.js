// app.js — tiny bootstrap: loads the trophy data, wires the modules together
// and owns the page state (trophies, earned set, active filters, open tab).
// The app fetches only data/trophies.json, same-origin. Nothing else is
// fetched at runtime.

import {
  loadChecklist,
  saveChecklist,
  setEarned,
  clearChecklist,
  progressSummary,
  exportProgress,
  importProgress,
} from './tracker.js';
import {
  createFilters,
  loadSpoilerPreference,
  saveSpoilerPreference,
  applyFilters,
} from './filters.js';
import { renderRoadmap, renderMissableSection } from './roadmap.js';
import { renderTrophyList, renderTrophyDetail } from './render.js';

const DATA_URL = 'data/trophies.json';

/** Fill in defaults for optional fields so the UI tolerates a trophy that
 *  is missing kind, missable, hidden, roadmap_stage, count or sources. */
function normalizeTrophy(raw) {
  return {
    id: raw.id ?? null,
    name: typeof raw.name === 'string' ? raw.name : 'Unnamed trophy',
    description: typeof raw.description === 'string' ? raw.description : '',
    grade: typeof raw.grade === 'string' ? raw.grade : 'bronze',
    guide: typeof raw.guide === 'string' ? raw.guide : '',
    kind: typeof raw.kind === 'string' ? raw.kind : 'activities',
    missable: raw.missable === true,
    hidden: raw.hidden === true,
    roadmap_stage:
      typeof raw.roadmap_stage === 'number' && raw.roadmap_stage >= 1 && raw.roadmap_stage <= 6
        ? raw.roadmap_stage
        : 5,
    count: typeof raw.count === 'number' ? raw.count : null,
    count_label: typeof raw.count_label === 'string' ? raw.count_label : null,
    sources: Array.isArray(raw.sources) ? raw.sources : [],
  };
}

async function loadTrophies() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Could not load ${DATA_URL} (${response.status})`);
  const data = await response.json();
  if (!data || !Array.isArray(data.trophies)) throw new Error('Trophy data is missing its trophies list.');
  return data.trophies.map(normalizeTrophy);
}

function startApp(trophies) {
  let earnedSet = loadChecklist();
  const filters = createFilters();
  let spoilersHidden = loadSpoilerPreference();

  // --- Element handles ---
  const earnedCountEl = document.getElementById('earned-count');
  const progressPercentEl = document.getElementById('progress-percent');
  const overallProgressEl = document.getElementById('overall-progress');
  const overallProgressFill = document.getElementById('overall-progress-fill');
  const progressNoteEl = document.getElementById('progress-note');
  const tabRoadmap = document.getElementById('tab-roadmap');
  const tabChecklist = document.getElementById('tab-checklist');
  const roadmapView = document.getElementById('roadmap-view');
  const checklistView = document.getElementById('checklist-view');
  const roadmapStagesEl = document.getElementById('roadmap-stages');
  const missableSectionEl = document.getElementById('missable-section');
  const searchInput = document.getElementById('search-input');
  const kindFilter = document.getElementById('kind-filter');
  const gradeFilter = document.getElementById('grade-filter');
  const earnedFilter = document.getElementById('earned-filter');
  const spoilerToggle = document.getElementById('spoiler-toggle');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');
  const resetBtn = document.getElementById('reset-btn');
  const resultCountEl = document.getElementById('result-count');
  const importMessageEl = document.getElementById('import-message');
  const trophyListEl = document.getElementById('trophy-list');
  const emptyStateEl = document.getElementById('empty-state');
  const detailPanel = document.getElementById('detail-panel');
  const detailContent = document.getElementById('detail-content');
  const detailClose = document.getElementById('detail-close');

  // --- Header progress ---
  function updateProgressHeader() {
    const summary = progressSummary(earnedSet, trophies.length);
    earnedCountEl.textContent = `${summary.earned} of ${summary.total} earned`;
    progressPercentEl.textContent = `${summary.percent}%`;
    overallProgressFill.style.width = `${summary.percent}%`;
    overallProgressEl.setAttribute('aria-valuenow', String(summary.percent));
    progressNoteEl.textContent =
      summary.earned === summary.total && summary.total > 0
        ? 'Platinum earned — you are a Leonida Legend.'
        : 'Earn the other trophies to unlock the Platinum.';
  }

  // --- Detail panel ---
  function openDetail(trophy) {
    renderTrophyDetail(detailContent, trophy, earnedSet, spoilersHidden);
    detailPanel.hidden = false;
    detailClose.focus();
  }

  function closeDetail() {
    detailPanel.hidden = true;
  }

  // --- Renders ---
  function renderAll() {
    updateProgressHeader();
    const visible = applyFilters(trophies, filters, earnedSet);
    const shown = renderTrophyList(trophyListEl, visible, earnedSet, spoilersHidden, {
      onToggleEarned: (trophy, earned) => {
        setEarned(earnedSet, trophy.name, earned);
        renderAll();
      },
      onSelect: openDetail,
    });
    resultCountEl.textContent = `Showing ${shown} of ${trophies.length} trophies · ${earnedSet.size} earned`;
    emptyStateEl.hidden = shown !== 0;
    renderRoadmap(roadmapStagesEl, trophies, earnedSet, (trophy, action) => {
      if (action.toggleEarned !== null) {
        setEarned(earnedSet, trophy.name, action.toggleEarned);
        renderAll();
      } else {
        openDetail(trophy);
      }
    });
    renderMissableSection(missableSectionEl, trophies, earnedSet, (trophy) => openDetail(trophy));
  }

  // --- Tabs ---
  function switchTab(tab) {
    const showRoadmap = tab === 'roadmap';
    tabRoadmap.classList.toggle('is-active', showRoadmap);
    tabChecklist.classList.toggle('is-active', !showRoadmap);
    tabRoadmap.setAttribute('aria-selected', String(showRoadmap));
    tabChecklist.setAttribute('aria-selected', String(!showRoadmap));
    roadmapView.hidden = !showRoadmap;
    checklistView.hidden = showRoadmap;
    roadmapView.classList.toggle('is-active', showRoadmap);
    checklistView.classList.toggle('is-active', !showRoadmap);
  }

  tabRoadmap.addEventListener('click', () => switchTab('roadmap'));
  tabChecklist.addEventListener('click', () => switchTab('checklist'));

  // --- Filters ---
  searchInput.addEventListener('input', () => {
    filters.query = searchInput.value;
    renderAll();
  });
  kindFilter.addEventListener('change', () => {
    filters.kind = kindFilter.value;
    renderAll();
  });
  gradeFilter.addEventListener('change', () => {
    filters.grade = gradeFilter.value;
    renderAll();
  });
  earnedFilter.addEventListener('change', () => {
    filters.earned = earnedFilter.value;
    renderAll();
  });
  spoilerToggle.checked = spoilersHidden;
  spoilerToggle.addEventListener('change', () => {
    spoilersHidden = spoilerToggle.checked;
    saveSpoilerPreference(spoilersHidden);
    renderAll();
  });

  // --- Export / import / reset ---
  exportBtn.addEventListener('click', () => exportProgress(earnedSet));
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files && importFile.files[0];
    if (!file) return;
    importMessageEl.hidden = true;
    try {
      const text = await file.text();
      const imported = importProgress(text, trophies.map((trophy) => trophy.name));
      earnedSet = imported;
      saveChecklist(earnedSet);
      importMessageEl.textContent = `Imported ${earnedSet.size} earned trophies from ${file.name}.`;
      importMessageEl.classList.remove('is-error');
      importMessageEl.hidden = false;
      renderAll();
    } catch (error) {
      importMessageEl.textContent = `Import failed: ${error.message}`;
      importMessageEl.classList.add('is-error');
      importMessageEl.hidden = false;
    }
    importFile.value = '';
  });
  resetBtn.addEventListener('click', () => {
    if (window.confirm('Clear every ticked trophy? You can export a backup first.')) {
      clearChecklist(earnedSet);
      renderAll();
    }
  });

  // --- Detail panel dismissal ---
  detailClose.addEventListener('click', closeDetail);
  detailPanel.addEventListener('click', (event) => {
    if (event.target === detailPanel) closeDetail();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !detailPanel.hidden) closeDetail();
  });

  renderAll();
}

loadTrophies()
  .then(startApp)
  .catch((error) => {
    const list = document.getElementById('trophy-list');
    if (list) {
      list.textContent = `Could not load the trophy data: ${error.message}`;
    }
    // eslint-disable-next-line no-console
    console.error(error);
  });
