import * as d3 from 'd3';
import { getSiteConfig, getStepColorMap } from '@/lib/config';

/**
 * Pipeline Visualization - Card Design
 * Step colors are read from site.config.json at runtime.
 */

// Base path for assets (matches Vite config)
const BASE_PATH = import.meta.env.BASE_URL || '/';

/**
 * Build color maps from config. Falls back to hardcoded Nord values
 * so existing deployments without a config keep working.
 */
function buildColorMaps() {
  const config = getSiteConfig();
  if (config) {
    const map = getStepColorMap(config);
    if (Object.keys(map).length > 0) return { auroraColors: map, stepColors: map };
  }
  // Fallback
  const fallback = {
    collect: '#bf616a',
    preprocess: '#d08770',
    abstract_aggregate: '#ebcb8b',
    correlate_cases: '#a3be8c',
    enhance_visualization: '#88c0d0',
    apply_mining: '#b48ead',
  };
  return { auroraColors: fallback, stepColors: fallback };
}

// Lazy-init so config is loaded first
let _colors = null;
function getColors() {
  if (!_colors) _colors = buildColorMaps();
  return _colors;
}

// Re-export for components that import STEP_COLORS directly
const STEP_COLORS_PROXY = new Proxy({}, {
  get(_, prop) { return getColors().stepColors[prop]; },
  ownKeys() { return Object.keys(getColors().stepColors); },
  getOwnPropertyDescriptor(_, prop) {
    const c = getColors().stepColors;
    if (prop in c) return { configurable: true, enumerable: true, value: c[prop] };
  },
});
export { STEP_COLORS_PROXY as STEP_COLORS };

// Keep AURORA_COLORS accessible too
const AURORA_COLORS_PROXY = new Proxy({}, {
  get(_, prop) { return getColors().auroraColors[prop]; },
});


// Modality colors
const MODALITY_COLORS = {
  text: '#88c0d0',
  image: '#a3be8c',
  video: '#b48ead',
  audio: '#d08770',
  sensor: '#ebcb8b',
  realtime: '#bf616a',
  mixed: '#8fbcbb',
};

// Step image mapping (using BASE_PATH for deployment)
const getStepImage = (step) => `${BASE_PATH}Picture ${{
  collect: '1',
  preprocess: '2',
  abstract_aggregate: '3',
  correlate_cases: '4',
  enhance_visualization: '5',
  apply_mining: '6',
}[step]}.png`;

// Design tokens (matching CSS)
const TOKENS = {
  bg: '#2e3440',
  bgSubtle: '#323845',
  cardBg: '#2D3348',
  surface: '#2D3348',
  surfaceRaised: '#3b4252',
  text: '#eceff4',
  textSecondary: '#d8dee9',
  textMuted: '#9aa5b8',
  border: 'rgba(76, 86, 106, 0.6)',
  accent: '#88c0d0',
  accentMuted: 'rgba(136, 192, 208, 0.15)',
};

// Arrow/connection styling
const ARROW_WIDTH = 2;

// Data sources for the collect step (real world)
const DATA_SOURCES = [
  { id: 'text', name: 'Text', color: MODALITY_COLORS.text },
  { id: 'image', name: 'Image', color: MODALITY_COLORS.image },
  { id: 'video', name: 'Video', color: MODALITY_COLORS.video },
  { id: 'audio', name: 'Audio', color: MODALITY_COLORS.audio },
  { id: 'sensor', name: 'Sensor', color: MODALITY_COLORS.sensor },
  { id: 'realtime', name: 'Real-Time', color: MODALITY_COLORS.realtime },
];

/**
 * Creates the card-based pipeline visualization
 */
export function createPipelineVisualization(container, data, options = {}) {
  const containerWidth = container.clientWidth;
  
  // Early return if container has no width yet
  if (!containerWidth || containerWidth === 0) {
    return {
      update: () => {},
      destroy: () => {},
    };
  }

  const {
    width = containerWidth,
    height = options.height || 340,
    onStepClick = () => {},
    onDataSourceClick = () => {},
    onStepHover = () => {},
    selectedStep = null,
    selectedModality = null,
    animated = true,
  } = options;

  // Track current selection state (avoids stale closure issues)
  let currentSelectedStep = selectedStep;
  let currentSelectedModality = selectedModality;

  // Clear previous content
  d3.select(container).selectAll('*').remove();

  const margin = { top: 16, right: 24, bottom: 16, left: 24 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create SVG
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr('aria-label', 'Process mining pipeline visualization')
    .style('font-family', 'Inter, -apple-system, BlinkMacSystemFont, sans-serif');

  const defs = svg.append('defs');

  // Arrow marker with muted color
  defs
    .append('marker')
    .attr('id', 'arrow-card')
    .attr('viewBox', '0 -4 8 8')
    .attr('refX', 6)
    .attr('refY', 0)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-3L8,0L0,3')
    .attr('fill', TOKENS.textMuted);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Calculate card dimensions - exclude collect step from card layout
  const pipelineStepsWithoutCollect = data.pipelineSteps.filter(s => s.id !== 'collect');
  const stepCount = pipelineStepsWithoutCollect.length;
  const gap = 16;
  
  // Reserve space for data source card on the left (wider to fit circles + title)
  const dataSourceCardWidth = 200;
  const availableWidth = innerWidth - dataSourceCardWidth - gap;
  const cardWidth = Math.min(150, (availableWidth - (stepCount - 1) * gap - (stepCount - 1) * 20) / stepCount);
  const cardHeight = innerHeight - 8;
  const imageSize = 110;
  const startX = dataSourceCardWidth + gap;

  // Count methods per step
  const methodCounts = {};
  data.pipelineSteps.forEach((step) => {
    methodCounts[step.id] = data.methods.filter((m) => m.pipeline_step === step.id).length;
  });

  // Create data source circles (first step - real world)
  const circleRadius = 22;
  const collectCardY = (innerHeight - cardHeight) / 2;
  const dataSourceStartY = 55; // Start below title
  const baseX = dataSourceCardWidth / 2;
  
  // Count methods per modality in the collect step
  const collectMethods = data.methods.filter(m => m.pipeline_step === 'collect');
  const totalCollectCount = collectMethods.length;
  const modalityCounts = {};
  DATA_SOURCES.forEach(source => {
    modalityCounts[source.id] = collectMethods.filter(m => 
      m.modalities && m.modalities.includes(source.id)
    ).length;
  });
  
  // Scattered positions with organic variation (no rigid grid)
  const dataSourcePositions = [
    { xOffset: -38, yOffset: 12 },     // Text - top left (shifted down to avoid title)
    { xOffset: 30, yOffset: 28 },      // Image - top right, slightly down
    { xOffset: -25, yOffset: 68 },     // Video - left middle
    { xOffset: 35, yOffset: 88 },      // Audio - right, lower
    { xOffset: -32, yOffset: 130 },    // Sensor - left lower
    { xOffset: 25, yOffset: 155 },     // Real-Time - right bottom
  ];

  // Create data source nodes with grid positions and method counts
  const dataSourceNodes = DATA_SOURCES.map((source, i) => ({
    ...source,
    x: baseX + dataSourcePositions[i].xOffset,
    y: dataSourceStartY + dataSourcePositions[i].yOffset,
    methodCount: modalityCounts[source.id],
  }));

  // === COLLECT CARD WRAPPER ===
  const collectCardGroup = g.append('g')
    .attr('class', 'collect-card')
    .attr('transform', `translate(0,${collectCardY})`)
    .style('cursor', 'pointer');

  // Card background (same style as other pipeline cards)
  const collectCardBg = collectCardGroup
    .append('rect')
    .attr('class', 'collect-card-bg')
    .attr('width', dataSourceCardWidth)
    .attr('height', cardHeight)
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('fill', TOKENS.cardBg)
    .attr('stroke', selectedStep === 'collect' && !selectedModality ? (AURORA_COLORS_PROXY.collect || '#bf616a') : TOKENS.border)
    .attr('stroke-width', selectedStep === 'collect' && !selectedModality ? 2.5 : 1.5);

  // Background image with opacity (inside the card)
  collectCardGroup
    .append('image')
    .attr('x', 10)
    .attr('y', 35)
    .attr('width', dataSourceCardWidth - 20)
    .attr('height', cardHeight - 70)
    .attr('href', `${BASE_PATH}Picture 1.png`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('opacity', 0.12)
    .style('pointer-events', 'none');

  // Card title at top
  collectCardGroup
    .append('text')
    .attr('x', dataSourceCardWidth / 2)
    .attr('y', 22)
    .attr('text-anchor', 'middle')
    .attr('fill', TOKENS.text)
    .attr('font-size', '15px')
    .attr('font-weight', '600')
    .text('Collect');

  // Subtitle
  collectCardGroup
    .append('text')
    .attr('x', dataSourceCardWidth / 2)
    .attr('y', 38)
    .attr('text-anchor', 'middle')
    .attr('fill', TOKENS.textMuted)
    .attr('font-size', '10px')
    .text('Real-World Data');

  // Total method count badge at bottom
  const collectBadgeY = cardHeight - 28;
  collectCardGroup
    .append('rect')
    .attr('class', 'collect-count-badge')
    .attr('x', dataSourceCardWidth / 2 - 20)
    .attr('y', collectBadgeY)
    .attr('width', 40)
    .attr('height', 20)
    .attr('rx', 10)
    .attr('fill', `${AURORA_COLORS_PROXY.collect || '#bf616a'}22`);

  collectCardGroup
    .append('text')
    .attr('class', 'collect-count-text')
    .attr('x', dataSourceCardWidth / 2)
    .attr('y', collectBadgeY + 14)
    .attr('text-anchor', 'middle')
    .attr('fill', AURORA_COLORS_PROXY.collect || '#bf616a')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('font-feature-settings', '"tnum"')
    .text(totalCollectCount);

  // Card click handler (for whole card, shows all collect methods)
  collectCardGroup
    .on('click', function (event) {
      // Only trigger if clicking the card background, not a data source circle
      if (event.target.classList.contains('collect-card-bg') || 
          event.target.tagName === 'image' ||
          event.target.classList.contains('collect-count-badge')) {
        event.stopPropagation();
        onStepClick('collect');
      }
    })
    .on('mouseenter', function () {
      if (currentSelectedStep !== 'collect' || currentSelectedModality) {
        collectCardBg
          .transition()
          .duration(150)
          .attr('stroke', AURORA_COLORS_PROXY.collect || '#bf616a')
          .attr('stroke-width', 2);
      }
      onStepHover('collect');
    })
    .on('mouseleave', function () {
      if (currentSelectedStep !== 'collect' || currentSelectedModality) {
        collectCardBg
          .transition()
          .duration(150)
          .attr('stroke', TOKENS.border)
          .attr('stroke-width', 1.5);
      }
      onStepHover(null);
    });

  // Create node positions for pipeline cards (excluding collect)
  const nodes = pipelineStepsWithoutCollect.map((step, i) => ({
    ...step,
    x: startX + i * (cardWidth + gap + 20),
    y: (innerHeight - cardHeight) / 2,
    width: cardWidth,
    height: cardHeight,
    methodCount: methodCounts[step.id],
    auroraColor: AURORA_COLORS_PROXY[step.id] || step.color || '#88c0d0',
  }));

  // Draw data source circles inside the collect card
  const dataSourceGroups = collectCardGroup
    .selectAll('.data-source')
    .data(dataSourceNodes)
    .enter()
    .append('g')
    .attr('class', 'data-source')
    .attr('transform', (d) => `translate(${d.x},${d.y})`);

  // Circle background
  dataSourceGroups
    .append('circle')
    .attr('class', 'ds-circle')
    .attr('r', circleRadius)
    .attr('fill', (d) => selectedModality === d.id ? `${d.color}33` : TOKENS.cardBg)
    .attr('stroke', (d) => d.color)
    .attr('stroke-width', (d) => selectedModality === d.id ? 3.5 : (selectedStep === 'collect' && !selectedModality ? 2.5 : 2))
    .attr('opacity', animated ? 0 : 1);

  if (animated) {
    dataSourceGroups.selectAll('.ds-circle')
      .transition()
      .duration(300)
      .delay((d, i) => i * 50)
      .attr('opacity', 1);
  }

  // Circle labels
  dataSourceGroups
    .append('text')
    .attr('class', 'ds-label')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.1em')
    .attr('fill', TOKENS.text)
    .attr('font-size', '9px')
    .attr('font-weight', '500')
    .text((d) => d.name);

  // Method count badges
  dataSourceGroups
    .append('text')
    .attr('class', 'ds-count')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.1em')
    .attr('fill', (d) => d.color)
    .attr('font-size', '10px')
    .attr('font-weight', '600')
    .attr('font-feature-settings', '"tnum"')
    .text((d) => d.methodCount);

  // Make data source circles clickable to filter by modality
  dataSourceGroups
    .style('cursor', 'pointer')
    .on('click', function (event, d) {
      event.stopPropagation();
      onDataSourceClick(d.id);
    })
    .on('mouseenter', function (event, d) {
      if (currentSelectedModality !== d.id) {
        d3.select(this).select('.ds-circle')
          .transition()
          .duration(150)
          .attr('stroke-width', 3)
          .attr('fill', `${d.color}22`);
      }
      onStepHover('collect');
    })
    .on('mouseleave', function (event, d) {
      if (currentSelectedModality !== d.id) {
        d3.select(this).select('.ds-circle')
          .transition()
          .duration(150)
          .attr('stroke-width', currentSelectedStep === 'collect' && !currentSelectedModality ? 2.5 : 2)
          .attr('fill', TOKENS.cardBg);
      }
      onStepHover(null);
    });

  // Draw curved connections from each data source to first pipeline card
  const firstCard = nodes[0];
  const targetX = firstCard.x - 4;
  const targetY = firstCard.y + cardHeight / 2;
  
  // Create curved path generator
  const createCurvedPath = (startX, startY, endX, endY) => {
    const midX = (startX + endX) / 2;
    const controlOffset = (endX - startX) * 0.3;
    return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  };
  
  // Data source nodes need absolute positions for connections
  const dataSourceConnectionNodes = dataSourceNodes.map(d => ({
    ...d,
    absX: d.x + circleRadius + 4,
    absY: collectCardY + d.y,
  }));
  
  const dataSourceConnections = g
    .selectAll('.ds-connection')
    .data(dataSourceConnectionNodes)
    .enter()
    .append('path')
    .attr('class', 'ds-connection')
    .attr('d', (d) => createCurvedPath(d.absX, d.absY, targetX, targetY))
    .attr('fill', 'none')
    .attr('stroke', (d) => selectedModality === d.id ? d.color : TOKENS.textMuted)
    .attr('stroke-width', (d) => selectedModality === d.id ? ARROW_WIDTH * 2 : ARROW_WIDTH)
    .attr('stroke-dasharray', '4,3')
    .attr('marker-end', 'url(#arrow-card)')
    .attr('opacity', animated ? 0 : 0.6);

  if (animated) {
    dataSourceConnections
      .transition()
      .duration(300)
      .delay((d, i) => 200 + i * 40)
      .attr('opacity', 0.6);
  }

  // Draw connections - subtle curved lines between cards
  const connections = g
    .selectAll('.connection')
    .data(nodes.slice(0, -1))
    .enter()
    .append('line')
    .attr('class', 'connection')
    .attr('x1', (d) => d.x + cardWidth + 4)
    .attr('y1', (d) => d.y + cardHeight / 2)
    .attr('x2', (d, i) => nodes[i + 1].x - 4)
    .attr('y2', (d, i) => nodes[i + 1].y + cardHeight / 2)
    .attr('stroke', TOKENS.textMuted)
    .attr('stroke-width', ARROW_WIDTH * 1.5)
    .attr('stroke-dasharray', '4,4')
    .attr('marker-end', 'url(#arrow-card)')
    .attr('opacity', animated ? 0 : 0.6);

  if (animated) {
    connections
      .transition()
      .duration(400)
      .delay((d, i) => 300 + i * 80)
      .attr('opacity', 0.6);
  }

  // Draw card nodes
  const nodeGroups = g
    .selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'pipeline-card')
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .attr('role', 'button')
    .attr('tabindex', 0)
    .attr('aria-label', (d) => `${d.name}: ${d.methodCount} methods`)
    .style('cursor', 'pointer');

  // Card background with Aurora border
  const cardRects = nodeGroups
    .append('rect')
    .attr('class', 'card-bg')
    .attr('width', cardWidth)
    .attr('height', cardHeight)
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('fill', TOKENS.cardBg)
    .attr('stroke', (d) => selectedStep === d.id ? d.auroraColor : TOKENS.border)
    .attr('stroke-width', (d) => selectedStep === d.id ? 2.5 : 1.5)
    .attr('opacity', animated ? 0 : 1);

  if (animated) {
    cardRects
      .transition()
      .duration(300)
      .delay((d, i) => i * 60)
      .attr('opacity', 1);
  }

  // Step name at TOP - proper text wrapping
  nodeGroups.each(function (d) {
    const group = d3.select(this);
    const words = d.name.split(/[\s/]+/);
    const lineHeight = 14;
    const maxLines = 2;
    const startY = 20;

    // Simple word wrap
    let lines = [];
    let currentLine = '';
    
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length > 10 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    lines = lines.slice(0, maxLines);

    const textGroup = group.append('g').attr('class', 'card-title');
    
    lines.forEach((line, i) => {
      textGroup
        .append('text')
        .attr('x', cardWidth / 2)
        .attr('y', startY + i * lineHeight)
        .attr('text-anchor', 'middle')
        .attr('fill', TOKENS.text)
        .attr('font-size', '15px')
        .attr('font-weight', '600')
        .text(line);
    });
  });

  // Step image - CENTERED in the card
  nodeGroups
    .append('image')
    .attr('x', (cardWidth - imageSize) / 2)
    .attr('y', (cardHeight - imageSize) / 2 - 4)
    .attr('width', imageSize)
    .attr('height', imageSize)
    .attr('href', (d) => getStepImage(d.id))
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('pointer-events', 'none');

  // Bottom info section - method count with Aurora accent
  const bottomY = cardHeight - 28;
  
  // Method count badge
  nodeGroups
    .append('rect')
    .attr('class', 'count-badge')
    .attr('x', cardWidth / 2 - 20)
    .attr('y', bottomY)
    .attr('width', 40)
    .attr('height', 20)
    .attr('rx', 10)
    .attr('fill', (d) => `${d.auroraColor}22`);

  nodeGroups
    .append('text')
    .attr('class', 'count-text')
    .attr('x', cardWidth / 2)
    .attr('y', bottomY + 14)
    .attr('text-anchor', 'middle')
    .attr('fill', (d) => d.auroraColor)
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('font-feature-settings', '"tnum"')
    .text((d) => `${d.methodCount}`);

  // Interactions - only change border color on hover
  nodeGroups
    .on('click', function (event, d) {
      event.stopPropagation();
      onStepClick(d.id);
    })
    .on('keydown', function (event, d) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onStepClick(d.id);
      }
    })
    .on('mouseenter', function (event, d) {
      if (currentSelectedStep !== d.id) {
        d3.select(this).select('.card-bg')
          .transition()
          .duration(150)
          .attr('stroke', d.auroraColor)
          .attr('stroke-width', 2);
      }
      onStepHover(d.id);
    })
    .on('mouseleave', function (event, d) {
      if (currentSelectedStep !== d.id) {
        d3.select(this).select('.card-bg')
          .transition()
          .duration(150)
          .attr('stroke', TOKENS.border)
          .attr('stroke-width', 1.5);
      }
      onStepHover(null);
    });

  // Update function for external state changes
  function update(newOptions = {}) {
    const { selectedStep: newSelected, selectedModality: newModality } = newOptions;
    
    // Update the tracked selection state
    currentSelectedStep = newSelected;
    currentSelectedModality = newModality;

    // Update collect card border based on selection
    const isCollectSelected = newSelected === 'collect';
    collectCardBg
      .transition()
      .duration(150)
      .attr('stroke', isCollectSelected && !newModality ? AURORA_COLORS.collect : TOKENS.border)
      .attr('stroke-width', isCollectSelected && !newModality ? 2.5 : 1.5);

    // Update data source circles for modality/collect selection
    dataSourceGroups.each(function (d) {
      const isThisModalitySelected = newModality === d.id;
      const group = d3.select(this);
      
      group.select('.ds-circle')
        .transition()
        .duration(150)
        .attr('fill', isThisModalitySelected ? `${d.color}33` : TOKENS.cardBg)
        .attr('stroke-width', isThisModalitySelected ? 3.5 : (isCollectSelected && !newModality ? 2.5 : 2));
    });

    // Update curved connections based on modality selection
    g.selectAll('.ds-connection')
      .transition()
      .duration(150)
      .attr('stroke', (d) => newModality === d.id ? d.color : TOKENS.textMuted)
      .attr('stroke-width', (d) => newModality === d.id ? ARROW_WIDTH * 2 : ARROW_WIDTH);

    nodeGroups.each(function (d) {
      const isSelected = newSelected === d.id;
      const group = d3.select(this);

      group.select('.card-bg')
        .transition()
        .duration(150)
        .attr('stroke', isSelected ? d.auroraColor : TOKENS.border)
        .attr('stroke-width', isSelected ? 2.5 : 1.5);
    });
  }

  return {
    update,
    destroy: () => {
      d3.select(container).selectAll('*').remove();
    },
  };
}

/**
 * Creates a mini pipeline visualization for compact displays
 */
export function createMiniPipeline(container, data, options = {}) {
  const { width = 400, height = 50, selectedStep = null, onStepClick = () => {} } = options;

  d3.select(container).selectAll('*').remove();

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);

  const nodeRadius = 14;
  const padding = 24;
  const availableWidth = width - padding * 2;
  const spacing = availableWidth / (data.pipelineSteps.length - 1);

  // Draw connecting line
  svg
    .append('line')
    .attr('x1', padding)
    .attr('y1', height / 2)
    .attr('x2', width - padding)
    .attr('y2', height / 2)
    .attr('stroke', TOKENS.border)
    .attr('stroke-width', 1);

  // Draw nodes
  const nodes = svg
    .selectAll('.mini-node')
    .data(data.pipelineSteps)
    .enter()
    .append('g')
    .attr('class', 'mini-node')
    .attr('transform', (d, i) => `translate(${padding + i * spacing},${height / 2})`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => onStepClick(d.id));

  nodes
    .append('circle')
    .attr('r', nodeRadius)
    .attr('fill', (d) => selectedStep === d.id ? TOKENS.accent : TOKENS.surface)
    .attr('stroke', (d) => selectedStep === d.id ? TOKENS.accent : TOKENS.border)
    .attr('stroke-width', 1);

  nodes
    .append('text')
    .attr('y', 4)
    .attr('text-anchor', 'middle')
    .attr('fill', (d) => selectedStep === d.id ? TOKENS.bg : TOKENS.textMuted)
    .attr('font-size', '10px')
    .attr('font-weight', '600')
    .text((d) => d.order);

  return {
    update: (newOptions) => {
      nodes.selectAll('circle')
        .attr('fill', (d) => newOptions.selectedStep === d.id ? TOKENS.accent : TOKENS.surface)
        .attr('stroke', (d) => newOptions.selectedStep === d.id ? TOKENS.accent : TOKENS.border);
      
      nodes.selectAll('text')
        .attr('fill', (d) => newOptions.selectedStep === d.id ? TOKENS.bg : TOKENS.textMuted);
    },
    destroy: () => d3.select(container).selectAll('*').remove(),
  };
}

export { MODALITY_COLORS, TOKENS };
