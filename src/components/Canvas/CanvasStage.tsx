"use client";

import type React from "react";
import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useDesignStore } from "../../store/designStore";
import { useCanvasStore } from "../../store/canvasStore";
import { useSettingsStore } from "../../store/settingsStore";
import {
  generatePolygon,
  generateSegmentPolygons,
  generateSegmentPolygonsWithDividers,
  cmToPx,
  pxToCm,
  snapToGrid,
  calculateCutoutPosition,
  isPointInCutout,
  calculateOffsetsFromPosition,
} from "../../utils/geometry";
import { validateDesign } from "../../utils/validation";
import {
  generateDimensionLines,
  drawDimensionLine,
} from "../../utils/dimensioning";
import { CONFIG } from "../../config";
import type { Cutout } from "../../types";

export const CanvasStage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const {
    design,
    setDimensions,
    updateCutout,
    addCutout,
    addDivider,
    setStyle,
    setSegmentStyle,
  } = useDesignStore();
  const {
    zoom,
    pan,
    setZoom,
    setPan,
    isDragging,
    setIsDragging,
    dragState,
    segmentResize,
    startCutoutDrag,
    updateCutoutDrag,
    endCutoutDrag,
    startSegmentResize,
    endSegmentResize,
    showGrid,
    setCanvasEl,
  } = useCanvasStore();
  const { units } = useSettingsStore();

  const [hoveredCutoutId, setHoveredCutoutId] = useState<string | null>(null);
  const [hoveredSegmentHandle, setHoveredSegmentHandle] = useState<string | null>(null); // e.g., 'U-A','U-B','L-A','L-B','S-LEN'
  const [hoveredHandleDir, setHoveredHandleDir] = useState<'h' | 'v' | null>(null);
  const validationErrors = useMemo(() => validateDesign(design), [design]);
  const [isDragOver, setIsDragOver] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    drawCountertop(ctx);

    drawCutouts(ctx);

    drawDimensions(ctx);

    drawSegmentHandles(ctx);

    drawValidationErrors(ctx);

    ctx.restore();
  }, [design, zoom, pan, hoveredCutoutId, hoveredSegmentHandle, validationErrors, units, showGrid]);

  // Throttled draw scheduling
  const rafIdRef = useRef<number | null>(null);
  const lastDrawRef = useRef<number>(0);

  const scheduleDraw = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame((ts) => {
      rafIdRef.current = null;
      if (ts - lastDrawRef.current >= CONFIG.CANVAS_REDRAW_THROTTLE_MS) {
        lastDrawRef.current = ts;
        draw();
      } else {
        // ensure a draw soon if throttled
        rafIdRef.current = requestAnimationFrame((ts2) => {
          lastDrawRef.current = ts2;
          draw();
          rafIdRef.current = null;
        });
      }
    });
  }, [draw]);

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;

    const gridSize = CONFIG.GRID_SIZE * 2;
    const startX = -pan.x / zoom;
    const startY = -pan.y / zoom;
    const endX = (width - pan.x) / zoom;
    const endY = (height - pan.y) / zoom;

    for (
      let x = Math.floor(startX / gridSize) * gridSize;
      x <= endX;
      x += gridSize
    ) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (
      let y = Math.floor(startY / gridSize) * gridSize;
      y <= endY;
      y += gridSize
    ) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  const drawCountertop = (ctx: CanvasRenderingContext2D) => {
    if (design.segmentStyles && design.segmentStyles.length > 0) {
      drawSegmentedCountertop(ctx);
    } else {
      drawSingleColorCountertop(ctx);
    }
  };

  const getFillForStyle = (
    ctx: CanvasRenderingContext2D,
    style: { type: string; value: string; textureScaleCanvas?: number; textureRotationCanvasDeg?: number },
  ): string | CanvasPattern => {
    if (style.type === "color") return style.value;

    // texture fill
    const cache = imageCacheRef.current;
    const url = style.value;
    const cached = cache.get(url);
    if (!cached) {
      const img = new Image();
      img.src = url;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        cache.set(url, img);
        scheduleDraw();
      };
      img.onerror = () => {
        // Keep fallback color
      };
      cache.set(url, img);
      return "#D2B48C";
    }
    if (!cached.complete) return "#D2B48C";
    const pattern = ctx.createPattern(cached, "repeat");
    if (pattern && (pattern as any).setTransform) {
      const s = style.textureScaleCanvas ?? CONFIG.TEXTURE.CANVAS_SCALE;
      const r = ((style.textureRotationCanvasDeg ?? CONFIG.TEXTURE.CANVAS_ROTATION_DEG) * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      // DOMMatrix(a, b, c, d, e, f) maps to matrix: [a c e; b d f; 0 0 1]
      const m = new DOMMatrix([
        cos * s,
        sin * s,
        -sin * s,
        cos * s,
        0,
        0,
      ]);
      (pattern as any).setTransform(m);
    }
    return pattern || "#D2B48C";
  };

  const drawSingleColorCountertop = (ctx: CanvasRenderingContext2D) => {
    const polygon = generatePolygon(
      design.layout,
      design.dimensions,
      design.orientation
    );
    if (polygon.length === 0) return;

    const pixelPolygon = polygon.map((p) => ({
      x: cmToPx(p.x) + CONFIG.CANVAS_PADDING,
      y: cmToPx(p.y) + CONFIG.CANVAS_PADDING,
    }));

    ctx.fillStyle = getFillForStyle(ctx, design.style);
    ctx.beginPath();
    ctx.moveTo(pixelPolygon[0].x, pixelPolygon[0].y);
    pixelPolygon.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 2;
    ctx.stroke();

    drawSegmentLabels(ctx, polygon, design);
  };

  const drawSegmentedCountertop = (ctx: CanvasRenderingContext2D) => {
    const segments = generateSegmentPolygonsWithDividers(
      design.layout,
      design.dimensions,
      design.orientation,
      design.dividers
    );

    segments.forEach((segment) => {
      const segmentStyle = design.segmentStyles?.find(
        (s) => s.segmentId === segment.segmentId
      );
      const style = segmentStyle?.style || design.style;

      const pixelPolygon = segment.polygon.map((p) => ({
        x: cmToPx(p.x) + CONFIG.CANVAS_PADDING,
        y: cmToPx(p.y) + CONFIG.CANVAS_PADDING,
      }));

      ctx.fillStyle = getFillForStyle(ctx, style);
      ctx.beginPath();
      ctx.moveTo(pixelPolygon[0].x, pixelPolygon[0].y);
      pixelPolygon.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 2;
      ctx.stroke();

      drawSplitSegmentLabels(ctx, segment);
    });

    const polygon = generatePolygon(
      design.layout,
      design.dimensions,
      design.orientation
    );
    drawSegmentLabels(ctx, polygon, design);
  };

  const drawCutouts = (ctx: CanvasRenderingContext2D) => {
    const polygon = generatePolygon(
      design.layout,
      design.dimensions,
      design.orientation
    );

    design.cutouts.forEach((cutout) => {
      let absolutePos = calculateCutoutPosition(cutout, polygon);

      if (
        dragState.isDraggingCutout &&
        dragState.draggedCutoutId === cutout.id
      ) {
        absolutePos = {
          x:
            pxToCm(dragState.lastMousePos.x - pan.x) / zoom -
            CONFIG.CANVAS_PADDING / 4 +
            dragState.dragOffset.x / 4,
          y:
            pxToCm(dragState.lastMousePos.y - pan.y) / zoom -
            CONFIG.CANVAS_PADDING / 4 +
            dragState.dragOffset.y / 4,
        };
      }

      const x = cmToPx(absolutePos.x - cutout.width / 2) + CONFIG.CANVAS_PADDING;
      const y = cmToPx(absolutePos.y - cutout.depth / 2) + CONFIG.CANVAS_PADDING;
      const width = cmToPx(cutout.width);
      const height = cmToPx(cutout.depth);

      const isHovered = hoveredCutoutId === cutout.id;
      const isDragged = dragState.draggedCutoutId === cutout.id;
      const hasError = validationErrors.some((error) =>
        error.id.includes(cutout.id)
      );

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, width, height);

      if (hasError) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
      } else if (isDragged) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
      } else if (isHovered) {
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(x, y, width, height);

      if (isHovered || isDragged) {
        ctx.fillStyle = isDragged ? "#3b82f6" : "#6b7280";
        const handleSize = 6;
        ctx.fillRect(
          x - handleSize / 2,
          y - handleSize / 2,
          handleSize,
          handleSize
        );
        ctx.fillRect(
          x + width - handleSize / 2,
          y - handleSize / 2,
          handleSize,
          handleSize
        );
        ctx.fillRect(
          x - handleSize / 2,
          y + height - handleSize / 2,
          handleSize,
          handleSize
        );
        ctx.fillRect(
          x + width - handleSize / 2,
          y + height - handleSize / 2,
          handleSize,
          handleSize
        );
      }

      ctx.strokeStyle = "#999999";
      ctx.lineWidth = 1;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 5, centerY);
      ctx.lineTo(centerX + 5, centerY);
      ctx.moveTo(centerX, centerY - 5);
      ctx.lineTo(centerX, centerY + 5);
      ctx.stroke();

      ctx.fillStyle = hasError ? "#ef4444" : "#333333";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cutout.name, centerX, centerY - 10);
      ctx.fillText(`${cutout.width}×${cutout.depth}`, centerX, centerY + 15);
    });
  };

  const drawDimensions = (ctx: CanvasRenderingContext2D) => {
    const dimensionLines = generateDimensionLines(design);

    dimensionLines.forEach((line) => {
      drawDimensionLine(ctx, line, zoom);
    });
  };

  const drawValidationErrors = (ctx: CanvasRenderingContext2D) => {
    validationErrors.forEach((error) => {
      if (!error.position) return;

      const x = cmToPx(error.position.x) + CONFIG.CANVAS_PADDING;
      const y = cmToPx(error.position.y) + CONFIG.CANVAS_PADDING;

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", x, y);
    });
  };

  const getMousePosition = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getCanvasCoordinates = (mousePos: {
    x: number;
    y: number;
  }): { x: number; y: number } => {
    return {
      x: pxToCm((mousePos.x - pan.x) / zoom - CONFIG.CANVAS_PADDING),
      y: pxToCm((mousePos.y - pan.y) / zoom - CONFIG.CANVAS_PADDING),
    };
  };

  const getUSegmentHandlePositions = () => {
    if (design.layout !== "u-ksztaltny") return {} as any;
    const d = design.dimensions.depth || 0;
    const C = design.dimensions.gapWidth || 0; // total top width
    const L = design.dimensions.lengthLeft || 0;
    const R = design.dimensions.lengthRight || 0;
    const outerW = C;
    // Bottom center of A
    const aX = cmToPx(d / 2) + CONFIG.CANVAS_PADDING;
    const aY = cmToPx(L + d) + CONFIG.CANVAS_PADDING;
    // Bottom center of B
    const bX = cmToPx(outerW - d / 2) + CONFIG.CANVAS_PADDING;
    const bY = cmToPx(R + d) + CONFIG.CANVAS_PADDING;
    return { 'U-A': { x: aX, y: aY, dir: 'v' as const }, 'U-B': { x: bX, y: bY, dir: 'v' as const } };
  };

  const getLSegmentHandlePositions = () => {
    if (design.layout !== "l-ksztaltny") return {} as any;
    const A = design.dimensions.lengthA || 0;
    const B = design.dimensions.lengthB || 0;
    const d = design.dimensions.depth || 0;
    const isLeft = design.orientation === 'left-l';
    // Horizontal handle for A at right edge of horizontal arm
    const ax = cmToPx(A) + CONFIG.CANVAS_PADDING;
    const ay = cmToPx(d / 2) + CONFIG.CANVAS_PADDING;
    // Vertical handle for B at bottom center of vertical arm
    const bx = cmToPx(isLeft ? d / 2 : A - d / 2) + CONFIG.CANVAS_PADDING;
    const by = cmToPx(d + B) + CONFIG.CANVAS_PADDING;
    return { 'L-A': { x: ax, y: ay, dir: 'h' as const }, 'L-B': { x: bx, y: by, dir: 'v' as const } };
  };

  const getStraightHandlePositions = () => {
    if (design.layout !== "prosty") return {} as any;
    const L = design.dimensions.length || 0;
    const d = design.dimensions.depth || 0;
    const hx = cmToPx(L) + CONFIG.CANVAS_PADDING;
    const hy = cmToPx(d / 2) + CONFIG.CANVAS_PADDING;
    return { 'S-LEN': { x: hx, y: hy, dir: 'h' as const } };
  };

  const drawSegmentHandles = (ctx: CanvasRenderingContext2D) => {
    const handles = {
      ...getUSegmentHandlePositions(),
      ...getLSegmentHandlePositions(),
      ...getStraightHandlePositions(),
    } as any;
    const size = 10; // screen px
    Object.keys(handles).forEach((id) => {
      const p = handles[id];
      if (!p) return;
      // world pixel coords (pre-zoom); draw size adjusted by zoom to keep constant screen size
      const s = size / zoom;
      ctx.fillStyle = hoveredSegmentHandle === id ? "#2563eb" : "#111827";
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    });
  };

  const findCutoutAtPosition = (canvasPos: {
    x: number;
    y: number;
  }): string | null => {
    const polygon = generatePolygon(
      design.layout,
      design.dimensions,
      design.orientation
    );

    for (const cutout of design.cutouts) {
      if (isPointInCutout(canvasPos, cutout, polygon)) {
        return cutout.id;
      }
    }
    return null;
  };

  const findSegmentAtPosition = (canvasPos: {
    x: number;
    y: number;
  }): string | null => {
    const segments = generateSegmentPolygonsWithDividers(
      design.layout,
      design.dimensions,
      design.orientation,
      design.dividers
    );

    for (const segment of segments) {
      let inside = false;
      const polygon = segment.polygon;

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (
          polygon[i].y > canvasPos.y !== polygon[j].y > canvasPos.y &&
          canvasPos.x <
            ((polygon[j].x - polygon[i].x) * (canvasPos.y - polygon[i].y)) /
              (polygon[j].y - polygon[i].y) +
              polygon[i].x
        ) {
          inside = !inside;
        }
      }

      if (inside) {
        return segment.segmentId;
      }
    }

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const mousePos = getMousePosition(e);
    const canvasPos = getCanvasCoordinates(mousePos);
    // Segment resize start (priority over cutout/pan)
    const allHandles = { ...getUSegmentHandlePositions(), ...getLSegmentHandlePositions(), ...getStraightHandlePositions() } as any;
    const ids = Object.keys(allHandles);
    const worldMouseX = (mousePos.x - pan.x) / zoom;
    const worldMouseY = (mousePos.y - pan.y) / zoom;
    const nearId = ids.find((id) => {
      const p = allHandles[id];
      const dx = p.x - worldMouseX;
      const dy = p.y - worldMouseY;
      return Math.sqrt(dx * dx + dy * dy) <= 12 / zoom; // ~12px screen
    });
    if (nearId) {
      if (nearId === 'U-A') startSegmentResize('A', canvasPos, design.dimensions.lengthLeft || 0);
      else if (nearId === 'U-B') startSegmentResize('B', canvasPos, design.dimensions.lengthRight || 0);
      else if (nearId === 'L-A') startSegmentResize('L-A', canvasPos, design.dimensions.lengthA || 0);
      else if (nearId === 'L-B') startSegmentResize('L-B', canvasPos, design.dimensions.lengthB || 0);
      else if (nearId === 'S-LEN') startSegmentResize('S-LEN', canvasPos, design.dimensions.length || 0);
      e.preventDefault();
      return;
    }
    const cutoutId = findCutoutAtPosition(canvasPos);

    if (cutoutId) {
      const cutout = design.cutouts.find((c) => c.id === cutoutId);
      if (cutout) {
        const polygon = generatePolygon(
          design.layout,
          design.dimensions,
          design.orientation
        );
        const cutoutCenter = calculateCutoutPosition(cutout, polygon);
        startCutoutDrag(cutoutId, canvasPos, cutoutCenter);
        e.preventDefault();
        return;
      }
    }

    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const mousePos = getMousePosition(e);
    const canvasPos = getCanvasCoordinates(mousePos);

    if (segmentResize.active) {
      // Update length in cm from current mouse position depending on handle
      const d = design.dimensions.depth || 0;
      const minLen = 10;
      switch (segmentResize.segmentId) {
        case 'A': {
          const newLen = Math.max(minLen, canvasPos.y - d);
          setDimensions({ lengthLeft: Math.round(newLen * 10) / 10 });
          break;
        }
        case 'B': {
          const newLen = Math.max(minLen, canvasPos.y - d);
          setDimensions({ lengthRight: Math.round(newLen * 10) / 10 });
          break;
        }
        case 'L-A': {
          const newLen = Math.max(minLen, canvasPos.x);
          setDimensions({ lengthA: Math.round(newLen * 10) / 10 });
          break;
        }
        case 'L-B': {
          const newLen = Math.max(minLen, canvasPos.y - d);
          setDimensions({ lengthB: Math.round(newLen * 10) / 10 });
          break;
        }
        case 'S-LEN': {
          const newLen = Math.max(minLen, canvasPos.x);
          setDimensions({ length: Math.round(newLen * 10) / 10 });
          break;
        }
      }
    } else if (dragState.isDraggingCutout) {
      updateCutoutDrag(mousePos);
    } else if (isDragging) {
      setPan({
        x: pan.x + e.movementX,
        y: pan.y + e.movementY,
      });
    } else {
      const cutoutId = findCutoutAtPosition(canvasPos);
      setHoveredCutoutId(cutoutId);
      // Hover detection for segment handles (all layouts)
      const handles = { ...getUSegmentHandlePositions(), ...getLSegmentHandlePositions(), ...getStraightHandlePositions() } as any;
      const worldMouseX = (mousePos.x - pan.x) / zoom;
      const worldMouseY = (mousePos.y - pan.y) / zoom;
      const nearKey = Object.keys(handles).find((id) => {
        const p = handles[id];
        const dx = p.x - worldMouseX;
        const dy = p.y - worldMouseY;
        return Math.sqrt(dx * dx + dy * dy) <= 12 / zoom;
      }) || null;
      setHoveredSegmentHandle(nearKey);
      setHoveredHandleDir(nearKey ? handles[nearKey].dir : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (segmentResize.active) {
      endSegmentResize();
      return;
    }
    if (dragState.isDraggingCutout && dragState.draggedCutoutId) {
      const mousePos = getMousePosition(e);
      const canvasPos = getCanvasCoordinates(mousePos);
      const finalPos = {
        x: canvasPos.x + dragState.dragOffset.x / 4,
        y: canvasPos.y + dragState.dragOffset.y / 4,
      };

      const cutout = design.cutouts.find(
        (c) => c.id === dragState.draggedCutoutId
      );
      if (cutout) {
        const polygon = generatePolygon(
          design.layout,
          design.dimensions,
          design.orientation
        );
        const newOffsets = calculateOffsetsFromPosition(
          finalPos,
          polygon,
          cutout.referenceX,
          cutout.referenceY
        );

        const snappedOffsets = {
          offsetX: snapToGrid(newOffsets.offsetX, 1),
          offsetY: snapToGrid(newOffsets.offsetY, 1),
        };

        updateCutout(dragState.draggedCutoutId, snappedOffsets);
      }

      endCutoutDrag();
    }

    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoveredCutoutId(null);
    setHoveredSegmentHandle(null);
    if (segmentResize.active) {
      endSegmentResize();
    }
    if (dragState.isDraggingCutout) {
      endCutoutDrag();
    }
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, zoom * delta));

    const canvas = canvasRef.current;
    if (!canvas) {
      setZoom(newZoom);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));

      if (data.type === "style") {
        setStyle(data.material);
        return;
      }

      if (data.type === "segment-style") {
        const mousePos = getMousePosition(e as any);
        const canvasPos = getCanvasCoordinates(mousePos);
        const segmentId = findSegmentAtPosition(canvasPos);

        if (segmentId) {
          setSegmentStyle(segmentId, data.material);
        } else {
          setSegmentStyle(data.targetSegment, data.material);
        }
        return;
      }

      if (data.type === "cutout") {
        const mousePos = getMousePosition(e as any);
        const canvasPos = getCanvasCoordinates(mousePos);

        const polygon = generatePolygon(
          design.layout,
          design.dimensions,
          design.orientation
        );
        const newOffsets = calculateOffsetsFromPosition(
          canvasPos,
          polygon,
          "lewo",
          "przod"
        );

        const newCutout: Omit<Cutout, "id"> = {
          name: data.name,
          type: data.cutoutType,
          width: data.defaultWidth,
          depth: data.defaultDepth,
          position: canvasPos,
          offsetX: snapToGrid(newOffsets.offsetX, 1),
          offsetY: snapToGrid(newOffsets.offsetY, 1),
          referenceX: "lewo",
          referenceY: "przod",
        };

        addCutout(newCutout);
      }

      if (data.type === "divider") {
        const mousePos = getMousePosition(e as any);
        const canvasPos = getCanvasCoordinates(mousePos);
        const segmentId = findSegmentAtPosition(canvasPos);

        if (segmentId) {
          const segments = generateSegmentPolygons(
            design.layout,
            design.dimensions,
            design.orientation
          );
          const segment = segments.find((s) => s.segmentId === segmentId);

          if (segment) {
            const segmentStart = getSegmentStartPoint(segment);
            const segmentEnd = getSegmentEndPoint(segment);
            const segmentLength = calculateSegmentLength(segment);

            const distanceFromStart = Math.sqrt(
              Math.pow(canvasPos.x - segmentStart.x, 2) +
                Math.pow(canvasPos.y - segmentStart.y, 2)
            );
            const position = Math.max(
              0,
              Math.min(1, distanceFromStart / segmentLength)
            );

            const newDivider = {
              type: data.dividerType,
              name: data.name,
              width: data.width,
              segmentId,
              position,
              price: data.price,
            };

            addDivider(newDivider);
          }
        }
      }
    } catch (error) {
      console.error("Error parsing drop data:", error);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      scheduleDraw();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [scheduleDraw]);

  useEffect(() => {
    scheduleDraw();
  }, [scheduleDraw]);

  // Expose canvas element to store for exports
  useEffect(() => {
    if (canvasRef.current) {
      setCanvasEl(canvasRef.current);
      return () => setCanvasEl(null);
    }
  }, [setCanvasEl]);

  return (
    <div className="flex-1 bg-gray-50 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${
          isDragOver
            ? "cursor-copy border-2 border-dashed border-blue-500"
            : dragState.isDraggingCutout
            ? "cursor-grabbing"
      : hoveredCutoutId
      ? "cursor-grab"
            : hoveredSegmentHandle
            ? (hoveredHandleDir === 'h' ? "cursor-ew-resize" : "cursor-ns-resize")
            : "cursor-move"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-500 pointer-events-none flex items-center justify-center">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Upuść tutaj, aby dodać dodatek lub zastosować styl
          </div>
        </div>
      )}

      {/* <div className="absolute bottom-0 left-0 right-0 bg-white border-t px-4 py-2 text-sm text-gray-600">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className="ml-4">
          Pan: {Math.round(pan.x)}, {Math.round(pan.y)}
        </span>
        {dragState.isDraggingCutout && (
          <span className="ml-4 text-blue-600">
            Przeciąganie: {design.cutouts.find((c) => c.id === dragState.draggedCutoutId)?.name}
          </span>
        )}
        {validationErrors.length > 0 && (
          <span className="ml-4 text-red-600">Błędy walidacji: {validationErrors.length}</span>
        )}
      </div> */}
    </div>
  );
};

const drawSplitSegmentLabels = (
  ctx: CanvasRenderingContext2D,
  segment: any
) => {
  const polygon = segment.polygon;
  if (polygon.length === 0) return;

  const centerX = polygon.reduce((sum: number, p: { x: number; y: number }) => sum + p.x, 0) / polygon.length;
  const centerY = polygon.reduce((sum: number, p: { x: number; y: number }) => sum + p.y, 0) / polygon.length;

  const pixelX = cmToPx(centerX) + CONFIG.CANVAS_PADDING;
  const pixelY = cmToPx(centerY) + CONFIG.CANVAS_PADDING;

  ctx.fillStyle = "#333333";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(segment.segmentId, pixelX, pixelY);
};

const drawSegmentLabels = (
  ctx: CanvasRenderingContext2D,
  polygon: { x: number; y: number }[],
  design: any
) => {
  if (design.layout === "prosty") return;

  ctx.fillStyle = "#333333";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (design.layout === "l-ksztaltny") {
    const mainSegmentCenterX =
      cmToPx(design.dimensions.lengthA! / 2) + CONFIG.CANVAS_PADDING;
    const mainSegmentCenterY =
      cmToPx(design.dimensions.depth / 2) + CONFIG.CANVAS_PADDING;

    ctx.fillText("A", mainSegmentCenterX, mainSegmentCenterY - 20);
    ctx.font = "12px sans-serif";
    ctx.fillText(
      `${design.dimensions.lengthA}cm`,
      mainSegmentCenterX,
      mainSegmentCenterY - 5
    );

    let sideSegmentCenterX: number;
    if (design.orientation === "left-l") {
      sideSegmentCenterX = cmToPx(design.dimensions.depth / 2) + CONFIG.CANVAS_PADDING;
    } else {
      sideSegmentCenterX =
        cmToPx(design.dimensions.lengthA! - design.dimensions.depth / 2) +
        CONFIG.CANVAS_PADDING;
    }

    const sideSegmentCenterY =
      cmToPx(design.dimensions.depth + design.dimensions.lengthB! / 2) +
      CONFIG.CANVAS_PADDING;

    ctx.font = "bold 16px sans-serif";
    ctx.fillText("B", sideSegmentCenterX, sideSegmentCenterY - 20);
    ctx.font = "12px sans-serif";
    ctx.fillText(
      `${design.dimensions.lengthB}cm`,
      sideSegmentCenterX,
      sideSegmentCenterY - 5
    );
  } else if (design.layout === "u-ksztaltny") {
    const settings = useSettingsStore.getState();
    const unitLabel = settings.units === "cm" ? "cm" : settings.units === "mm" ? "mm" : "in";
    const fmt = (cmVal: number) => {
      const v = settings.convertValue(cmVal, "cm" as any, settings.units as any);
      return settings.units === "mm" ? Math.round(v) + unitLabel : (Math.round(v * 100) / 100) + unitLabel;
    };
    const d = design.dimensions.depth
    const C = design.dimensions.gapWidth || 0 // treat as total top width
    const g = Math.max(0, C - 2 * d)
    const L = design.dimensions.lengthLeft || 0
    const R = design.dimensions.lengthRight || 0
    const outerW = C

    const leftArmCenterX = cmToPx(d / 2) + CONFIG.CANVAS_PADDING
    const leftArmCenterY = cmToPx((L + d) / 2) + CONFIG.CANVAS_PADDING

    ctx.fillText("A", leftArmCenterX, leftArmCenterY - 20)
    ctx.font = "12px sans-serif"
    ctx.fillText(`${fmt(L)}`, leftArmCenterX, leftArmCenterY - 5)

    const rightArmCenterX = cmToPx(outerW - d / 2) + CONFIG.CANVAS_PADDING
    const rightArmCenterY = cmToPx((R + d) / 2) + CONFIG.CANVAS_PADDING

    ctx.font = "bold 16px sans-serif"
    ctx.fillText("B", rightArmCenterX, rightArmCenterY - 20)
    ctx.font = "12px sans-serif"
    ctx.fillText(`${fmt(R)}`, rightArmCenterX, rightArmCenterY - 5)

    const middleCenterX = cmToPx(outerW / 2) + CONFIG.CANVAS_PADDING
    const middleCenterY = cmToPx(d / 2) + CONFIG.CANVAS_PADDING

    ctx.font = "bold 16px sans-serif"
    ctx.fillText("C", middleCenterX, middleCenterY - 20)
    ctx.font = "12px sans-serif"
    ctx.fillText(`${fmt(C)}`, middleCenterX, middleCenterY - 5)
  }
};

const calculateSegmentLength = (segment: any): number => {
  const polygon = segment.polygon;
  if (polygon.length < 2) return 0;

  const start = polygon[0];
  const end = polygon[polygon.length - 1];
  return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
};

const getSegmentStartPoint = (segment: any): { x: number; y: number } => {
  return segment.polygon[0] || { x: 0, y: 0 };
};

const getSegmentEndPoint = (segment: any): { x: number; y: number } => {
  const polygon = segment.polygon;
  return polygon[polygon.length - 1] || { x: 0, y: 0 };
};

const getDividerColor = (dividerType: string): string => {
  const colors: Record<string, string> = {
    "szafka-stojaca": "#8B4513",
    przerwa: "#FFFFFF",
    kolumna: "#696969",
    "lodowka-zabudowana": "#2F4F4F",
    zmywarka: "#4682B4",
  };
  return colors[dividerType] || "#999999";
};
