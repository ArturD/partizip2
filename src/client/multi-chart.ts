import type { Point } from './trends.js';
// Small native SVG chart: no runtime charting dependency or external assets.
export interface Series { name: string; color: string; dash: string; points: Point[] }
export function multiChart(container: HTMLElement, series: Series[], title: string) {
  container.replaceChildren();
  const points = series.flatMap(s => s.points).sort((a,b) => a.x-b.x);
  const legend = document.createElement('p');
  for (const item of series) {
    const label = document.createElement('span'); label.textContent = `${item.name} (${item.dash === '' ? 'solid' : item.dash === '9 4' ? 'dashed' : item.dash === '3 4' ? 'dotted' : 'dash-dot'})  `; label.style.color = item.color; label.style.fontWeight = '700'; legend.append(label);
  }
  container.append(legend);
  if (!points.some(point => point.value !== null)) {
    const empty = document.createElement('p'); empty.className = 'small';
    empty.textContent = 'No plottable data in this selection. For lesson charts, each case needs a full smoothing period.';
    container.append(empty); return;
  }
  const ns = 'http://www.w3.org/2000/svg';
  const node = (tag: string, attributes: Record<string, string> = {}, text?: string) => {
    const element = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const svg = node('svg', { viewBox: '0 0 700 240', role: 'img', 'aria-label': title });
  svg.append(node('title', {}, title));
  const min = points[0].x, max = points[points.length - 1].x;
  const x = (point: Point) => max === min ? 370 : 55 + (point.x - min) / (max - min) * 615;
  const y = (value: number) => 195 - value * 1.7;
  for (const value of [0, 50, 100]) {
    svg.append(node('line', { x1: '55', x2: '670', y1: String(y(value)), y2: String(y(value)), stroke: '#d6dfe7' }));
    svg.append(node('text', { x: '43', y: String(y(value) + 5), 'text-anchor': 'end', fill: '#526577', 'font-size': '14' }, `${value}%`));
  }
  for (const item of series) {
    let path = '', connected = false;
    for (const point of item.points) {
      if (point.value === null) { connected = false; continue; }
      path += `${connected ? 'L' : 'M'}${x(point)},${y(point.value)} `; connected = true;
    }
    svg.append(node('path', { d: path, fill: 'none', stroke: item.color, 'stroke-dasharray': item.dash, 'stroke-width': '3', 'stroke-linejoin': 'round' }));
    for (const point of item.points) {
      if (point.value === null) continue;
      const dot = node('circle', { cx: String(x(point)), cy: String(y(point.value)), r: '3', fill: item.color });
      dot.append(node('title', {}, `${item.name} · ${point.label}: ${Math.round(point.value)}%. ${point.detail}`)); svg.append(dot);
    }
  }
  svg.append(node('text', { x: '55', y: '225', fill: '#526577', 'font-size': '14' }, points[0].label));
  if (points.length > 1) svg.append(node('text', { x: '670', y: '225', 'text-anchor': 'end', fill: '#526577', 'font-size': '14' }, points[points.length - 1].label));
  container.append(svg);
  const details = document.createElement('details'), summary = document.createElement('summary');
  summary.textContent = 'View graph data'; details.append(summary);
  const scroll = document.createElement('div'); scroll.className = 'table-scroll';
  const table = document.createElement('table');
  const head = document.createElement('tr');
  for (const label of ['Case', 'Point', 'Accuracy', 'Sample']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; head.append(th); }
  const thead = document.createElement('thead'); thead.append(head); table.append(thead);
  const body = document.createElement('tbody');
  for (const item of series) for (const point of item.points) {
    const row = document.createElement('tr');
    for (const value of [item.name, point.label, point.value === null ? 'No answers in window' : `${Math.round(point.value)}%`, point.detail]) { const td = document.createElement('td'); td.textContent = value; row.append(td); }
    body.append(row);
  }
  table.append(body); scroll.append(table); details.append(scroll); container.append(details);
}
