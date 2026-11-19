// roadmap.js — the 6-stage roadmap view plus the prominent Missable section.
// Renders into containers owned by index.html; clicks on a trophy open the
// detail view through the onSelectTrophy callback supplied by app.js.

import { GRADE_LABELS, KIND_LABELS } from './filters.js';

/** The six stages, in play order. Stage numbers match roadmap_stage in the data. */
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Story playthrough',
    blurb: 'Play the story naturally. Pick up the easy story trophies and the missables flagged below as you go — do not rush past them.',
  },
  {
    stage: 2,
    title: 'Strangers & side content',
    blurb: 'Finish the stranger mission strands and side characters. Most of these unlock as the story opens up the map.',
  },
  {
    stage: 3,
    title: 'Collectibles',
    blurb: 'Sweep the map for cards, WAiNK spots and the rest. Do this after the story so every area is open.',
  },
  {
    stage: 4,
    title: 'Activities & challenges',
    blurb: 'Races, shooting range, fishing, bowling and the other activities. Gold medals and wins live here.',
  },
  {
    stage: 5,
    title: 'Grind & cleanup',
    blurb: 'The long counts: stunts, vehicles, money, challenges. Chip away at these between other stages and finish them here.',
  },
  {
    stage: 6,
    title: 'Platinum',
    blurb: 'Earn every other trophy and the Platinum pops automatically. There is nothing extra to do.',
  },
];

/** How many trophies in this stage are earned, out of how many in the stage. */
export function stageProgress(trophies, stage, earnedSet) {
  const stageTrophies = trophies.filter((trophy) => trophy.roadmap_stage === stage);
  const earned = stageTrophies.filter((trophy) => earnedSet.has(trophy.name)).length;
  return { earned, total: stageTrophies.length, percent: stageTrophies.length === 0 ? 0 : Math.round((earned / stageTrophies.length) * 100) };
}

/** Render all six stages into `container`. Each stage shows its trophies with
 *  earned state, a grade badge, and a per-stage progress bar. */
export function renderRoadmap(container, trophies, earnedSet, onSelectTrophy) {
  container.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const stageTrophies = trophies.filter((trophy) => trophy.roadmap_stage === stage.stage);
    const progress = stageProgress(trophies, stage.stage, earnedSet);

    const section = document.createElement('section');
    section.className = 'roadmap-stage';
    section.setAttribute('aria-label', `Stage ${stage.stage}: ${stage.title}`);

    const head = document.createElement('div');
    head.className = 'roadmap-stage-head';
    const heading = document.createElement('h2');
    const number = document.createElement('span');
    number.className = 'stage-number';
    number.textContent = `Stage ${stage.stage}`;
    heading.append(number, document.createTextNode(stage.title));
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${progress.earned} / ${progress.total} earned`;
    head.append(heading, count);
    section.append(head);

    const blurb = document.createElement('p');
    blurb.className = 'stage-blurb';
    blurb.textContent = stage.blurb;
    section.append(blurb);

    const track = document.createElement('div');
    track.className = 'stage-progress-track';
    const fill = document.createElement('div');
    fill.className = 'stage-progress-fill';
    fill.style.width = `${progress.percent}%`;
    fill.setAttribute('role', 'progressbar');
    fill.setAttribute('aria-label', `Stage ${stage.stage} progress`);
    fill.setAttribute('aria-valuemin', '0');
    fill.setAttribute('aria-valuemax', '100');
    fill.setAttribute('aria-valuenow', String(progress.percent));
    track.append(fill);
    section.append(track);

    const list = document.createElement('ul');
    list.className = 'stage-trophies';
    for (const trophy of stageTrophies) {
      const item = document.createElement('li');
      item.className = 'stage-trophy';
      if (earnedSet.has(trophy.name)) item.classList.add('is-earned');

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'stage-check';
      check.checked = earnedSet.has(trophy.name);
      check.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
      check.addEventListener('change', (event) => {
        event.stopPropagation();
        onSelectTrophy(trophy, { toggleEarned: check.checked });
      });
      item.append(check);

      const name = document.createElement('span');
      name.className = 'stage-trophy-name';
      name.textContent = trophy.name;
      item.append(name);

      if (trophy.missable === true) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-missable';
        badge.textContent = 'Missable';
        item.append(badge);
      }
      const gradeBadge = document.createElement('span');
      gradeBadge.className = `badge badge-grade-${trophy.grade}`;
      gradeBadge.textContent = GRADE_LABELS[trophy.grade] ?? trophy.grade;
      item.append(gradeBadge);

      item.addEventListener('click', () => onSelectTrophy(trophy, { toggleEarned: null }));
      list.append(item);
    }
    section.append(list);
    container.append(section);
  }
}

/**
 * Render the Missable section: every trophy flagged missable, with a warning
 * badge and the "when it can be missed" note taken from its own guide text.
 * Earned missables are dimmed. Hidden when there are no missable trophies.
 */
export function renderMissableSection(container, trophies, earnedSet, onSelectTrophy) {
  container.replaceChildren();
  const missables = trophies.filter((trophy) => trophy.missable === true);
  if (missables.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const heading = document.createElement('h2');
  heading.textContent = '⚠ Missable trophies — read before you play';
  container.append(heading);

  const intro = document.createElement('p');
  intro.textContent =
    'These trophies can be locked out if you pass the moment they belong to. ' +
    'Check each one before its mission or choice, and keep a manual save if you want a safety net.';
  container.append(intro);

  const list = document.createElement('ul');
  list.className = 'missable-list';
  for (const trophy of missables) {
    const item = document.createElement('li');
    item.className = 'missable-item';
    if (earnedSet.has(trophy.name)) item.classList.add('is-earned');

    const head = document.createElement('div');
    head.className = 'missable-head';
    const badge = document.createElement('span');
    badge.className = 'badge badge-missable';
    badge.textContent = 'Missable';
    const name = document.createElement('span');
    name.className = 'missable-name';
    name.textContent = trophy.name;
    const kind = document.createElement('span');
    kind.className = 'badge badge-kind';
    kind.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
    head.append(badge, name, kind);
    item.append(head);

    const when = document.createElement('p');
    when.className = 'missable-when';
    when.textContent = trophy.guide || trophy.description || '';
    item.append(when);

    item.addEventListener('click', () => onSelectTrophy(trophy, { toggleEarned: null }));
    list.append(item);
  }
  container.append(list);
}
