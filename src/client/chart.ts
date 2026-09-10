import type { Point } from './trends.js';
// Small native SVG chart: no runtime charting dependency or external assets.
export function chart(container: HTMLElement, points: Point[], title: string) {
  container.replaceChildren();
  if (!points.some(point => point.value !== null)) {
    const empty = document.createElement('p'); empty.className = 'small';
    empty.textContent = 'No practice in this selection yet. Your first answer will start the graph.';
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
  let path = '', connected = false;
  for (const point of points) {
    if (point.value === null) { connected = false; continue; }
    path += `${connected ? 'L' : 'M'}${x(point)},${y(point.value)} `; connected = true;
  }
  svg.append(node('path', { d: path, fill: 'none', stroke: '#236db0', 'stroke-width': '3', 'stroke-linejoin': 'round' }));
  for (const point of points) {
    if (point.value === null) continue;
    const dot = node('circle', { cx: String(x(point)), cy: String(y(point.value)), r: '3', fill: '#236db0' });
    dot.append(node('title', {}, `${point.label}: ${Math.round(point.value)}%. ${point.detail}`)); svg.append(dot);
  }
  svg.append(node('text', { x: '55', y: '225', fill: '#526577', 'font-size': '14' }, points[0].label));
  if (points.length > 1) svg.append(node('text', { x: '670', y: '225', 'text-anchor': 'end', fill: '#526577', 'font-size': '14' }, points[points.length - 1].label));
  container.append(svg);
  const details = document.createElement('details'), summary = document.createElement('summary');
  summary.textContent = 'View graph data'; details.append(summary);
  const scroll = document.createElement('div'); scroll.className = 'table-scroll';
  const table = document.createElement('table');
  const head = document.createElement('tr');
  for (const label of ['Point', 'Moving accuracy', 'Sample']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; head.append(th); }
  const thead = document.createElement('thead'); thead.append(head); table.append(thead);
  const body = document.createElement('tbody');
  for (const point of points) {
    const row = document.createElement('tr');
    for (const value of [point.label, point.value === null ? 'No answers in window' : `${Math.round(point.value)}%`, point.detail]) { const td = document.createElement('td'); td.textContent = value; row.append(td); }
    body.append(row);
  }
  table.append(body); scroll.append(table); details.append(scroll); container.append(details);
}
