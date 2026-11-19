// render.js — renders the trophy checklist cards and the trophy detail view.
// All text from the data file is inserted with textContent (never innerHTML),
// so a stray character in the JSON cannot break the page. Source links are
// plain anchors built from the URLs in the data — the app fetches nothing
// from them; they only open if the reader follows them.

import { GRADE_LABELS, KIND_LABELS, isSpoilerConcealed } from './filters.js';

export const HIDDEN_TROPHY_LABEL = 'Hidden trophy — earn it to reveal';

/** Create one checklist card for a trophy. `handlers` supplies onToggleEarned
 *  (checkbox change) and onSelect (card click opens the detail view). When the
 *  trophy is spoiler-concealed, its name and description are replaced by the
 *  hidden label; grade/kind badges still show so filters stay meaningful. */
export function createTrophyCard(trophy, earnedSet, spoilersHidden, handlers) {
  const concealed = isSpoilerConcealed(trophy, earnedSet, spoilersHidden);
  const earned = earnedSet.has(trophy.name);

  const card = document.createElement('article');
  card.className = 'trophy-card';
  if (earned) card.classList.add('is-earned');
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', concealed ? HIDDEN_TROPHY_LABEL : trophy.name);

  const head = document.createElement('div');
  head.className = 'trophy-card-head';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earned;
  check.setAttribute('aria-label', `Mark ${concealed ? 'hidden trophy' : trophy.name} as earned`);
  check.addEventListener('click', (event) => event.stopPropagation());
  check.addEventListener('change', () => handlers.onToggleEarned(trophy, check.checked));
  head.append(check);

  const name = document.createElement('h3');
  name.className = 'trophy-name';
  if (concealed) name.classList.add('is-hidden-name');
  name.textContent = concealed ? HIDDEN_TROPHY_LABEL : trophy.name;
  head.append(name);
  card.append(head);

  const description = document.createElement('p');
  description.className = 'trophy-description';
  description.textContent = concealed ? 'Story details are hidden until you earn this trophy.' : trophy.description;
  card.append(description);

  if (typeof trophy.count === 'number' && trophy.count > 0) {
    const count = document.createElement('p');
    count.className = 'count-progress';
    const strong = document.createElement('strong');
    strong.textContent = trophy.count_label || `0 / ${trophy.count}`;
    count.append(strong);
    card.append(count);
  }

  const badges = document.createElement('div');
  badges.className = 'trophy-badges';

  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge badge-grade-${trophy.grade}`;
  gradeBadge.textContent = GRADE_LABELS[trophy.grade] ?? trophy.grade;
  badges.append(gradeBadge);

  const kindBadge = document.createElement('span');
  kindBadge.className = 'badge badge-kind';
  kindBadge.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  badges.append(kindBadge);

  if (trophy.missable === true) {
    const missableBadge = document.createElement('span');
    missableBadge.className = 'badge badge-missable';
    missableBadge.textContent = 'Missable';
    badges.append(missableBadge);
  }
  if (trophy.hidden === true) {
    const hiddenBadge = document.createElement('span');
    hiddenBadge.className = 'badge badge-hidden';
    hiddenBadge.textContent = 'Hidden';
    badges.append(hiddenBadge);
  }
  card.append(badges);

  card.addEventListener('click', () => handlers.onSelect(trophy));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlers.onSelect(trophy);
    }
  });
  return card;
}

/** Render the filtered trophy list into `container`. Returns the number shown. */
export function renderTrophyList(container, trophies, earnedSet, spoilersHidden, handlers) {
  container.replaceChildren();
  for (const trophy of trophies) {
    container.append(createTrophyCard(trophy, earnedSet, spoilersHidden, handlers));
  }
  return trophies.length;
}

/**
 * Render the trophy detail view into `panelContent`: official name and
 * description, grade/kind/missable badges, the full guide in its own words,
 * and the cited sources as links. A spoiler-concealed trophy shows only the
 * hidden label — the guide is a spoiler too.
 */
export function renderTrophyDetail(panelContent, trophy, earnedSet, spoilersHidden) {
  panelContent.replaceChildren();
  const concealed = isSpoilerConcealed(trophy, earnedSet, spoilersHidden);

  const heading = document.createElement('h2');
  heading.textContent = concealed ? HIDDEN_TROPHY_LABEL : trophy.name;
  panelContent.append(heading);

  const badges = document.createElement('div');
  badges.className = 'trophy-badges';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge badge-grade-${trophy.grade}`;
  gradeBadge.textContent = GRADE_LABELS[trophy.grade] ?? trophy.grade;
  badges.append(gradeBadge);
  const kindBadge = document.createElement('span');
  kindBadge.className = 'badge badge-kind';
  kindBadge.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  badges.append(kindBadge);
  if (trophy.missable === true) {
    const missableBadge = document.createElement('span');
    missableBadge.className = 'badge badge-missable';
    missableBadge.textContent = 'Missable';
    badges.append(missableBadge);
  }
  panelContent.append(badges);

  const description = document.createElement('p');
  description.className = 'trophy-description';
  description.textContent = concealed
    ? 'This is a story trophy. Its details stay hidden until you earn it — turn off "Hide story spoilers" in the checklist to reveal it.'
    : trophy.description;
  panelContent.append(description);

  if (!concealed) {
    if (typeof trophy.count === 'number' && trophy.count > 0) {
      const count = document.createElement('p');
      count.className = 'count-progress';
      const strong = document.createElement('strong');
      strong.textContent = trophy.count_label || `Target: ${trophy.count}`;
      count.append(strong);
      panelContent.append(count);
    }

    const guide = document.createElement('p');
    guide.className = 'detail-guide';
    guide.textContent = trophy.guide || 'No guide written for this trophy yet.';
    panelContent.append(guide);

    const sources = Array.isArray(trophy.sources) ? trophy.sources : [];
    if (sources.length > 0) {
      const sourcesSection = document.createElement('div');
      sourcesSection.className = 'detail-sources';
      const sourcesHeading = document.createElement('h3');
      sourcesHeading.textContent = 'Sources';
      sourcesSection.append(sourcesHeading);
      const list = document.createElement('ul');
      for (const source of sources) {
        if (!source || typeof source.url !== 'string' || !source.url) continue;
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = typeof source.label === 'string' && source.label ? source.label : source.url;
        item.append(link);
        list.append(item);
      }
      if (list.children.length > 0) {
        sourcesSection.append(list);
        panelContent.append(sourcesSection);
      }
    }
  }

  const meta = document.createElement('p');
  meta.className = 'detail-meta';
  meta.textContent = earnedSet.has(trophy.name)
    ? '✓ Earned — ticked off in your checklist.'
    : 'Not earned yet. Tick it off in the checklist once you unlock it on PlayStation.';
  panelContent.append(meta);
}
