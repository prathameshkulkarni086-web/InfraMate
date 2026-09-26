import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import {
  Layers,
  Sparkles,
  Eye,
  RotateCw,
  Sun,
  Moon,
  Box,
  Check,
  Maximize2,
  Minimize2,
  RefreshCw,
  Compass,
  Sliders,
} from "lucide-react";
import { BuildingConcept } from "../../types";
import { aiService } from "../../services/aiService";

export const BuildingVisualizerView: React.FC = () => {
  const [params, setParams] = useState({
    plotArea: 2000,
    floors: 2,
    bedrooms: 3,
    bathrooms: 3,
    style: "Modern Minimalist",
    budget: "₹65,00,000",
  });

  const [concepts, setConcepts] = useState<BuildingConcept[]>([]);
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0);
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [isWireframe, setIsWireframe] = useState(false);
  const [isDaylight, setIsDaylight] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Fetch / Generate Concepts
  const handleGenerateConcepts = async () => {
    setIsLoading(true);
    try {
      const data = await aiService.generateBuildingConcepts(params);
      if (data && data.concepts && data.concepts.length > 0) {
        setConcepts(data.concepts);
        setSelectedConceptIndex(0);
        setActiveFloorIndex(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateConcepts();
  }, []);

  const activeConcept = concepts[selectedConceptIndex] || null;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || viewMode !== "3d") return;

    const canvas = canvasRef.current;
    const width = canvas.parentElement?.clientWidth || 600;
    const height = 440;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDaylight ? 0x0f172a : 0x050811);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 18, 26);
    camera.lookAt(0, 4, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(
      isDaylight ? 0xffffff : 0x334155,
      isDaylight ? 0.8 : 0.3
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      isDaylight ? 0xfffaed : 0x60a5fa,
      isDaylight ? 1.4 : 0.4
    );
    sunLight.position.set(20, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);
    lightRef.current = sunLight;

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isDaylight ? 0x1e293b : 0x090d16,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Helper
    const grid = new THREE.GridHelper(50, 25, 0x3b82f6, 0x334155);
    grid.position.y = 0.01;
    scene.add(grid);

    // Building Group
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    buildingGroupRef.current = buildingGroup;

    // Mouse Drag Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      buildingGroup.rotation.y += deltaX * 0.008;
      camera.position.y = Math.max(5, Math.min(35, camera.position.y - deltaY * 0.05));
      camera.lookAt(0, 4, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.03;
      camera.position.z = Math.max(12, Math.min(50, camera.position.z + zoomFactor));
      camera.position.x = Math.max(10, Math.min(40, camera.position.x + zoomFactor * 0.8));
      camera.lookAt(0, 4, 0);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // Animation Loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      if (!isDragging) {
        buildingGroup.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, [viewMode, isDaylight]);

  // Construct 3D Procedural Building Model based on Active Concept
  useEffect(() => {
    if (!buildingGroupRef.current || viewMode !== "3d") return;
    const group = buildingGroupRef.current;

    // Clear existing children
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    if (!activeConcept) return;

    const numFloors = activeConcept.floorPlanLevels?.length || 2;
    const floorHeight = 4.2;

    // Build each level
    (activeConcept.floorPlanLevels || []).forEach((levelData, fIdx) => {
      const floorY = fIdx * floorHeight;

      // Concrete Floor Slab
      const slabGeo = new THREE.BoxGeometry(14, 0.4, 11);
      const slabMat = new THREE.MeshStandardMaterial({
        color: fIdx === 0 ? 0x475569 : 0x334155,
        wireframe: isWireframe,
        roughness: 0.5,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, floorY, 0);
      slab.receiveShadow = true;
      slab.castShadow = true;
      group.add(slab);

      // Structural RCC Columns (4 Corners + 2 Mid)
      const columnPositions = [
        [-6.5, -5],
        [6.5, -5],
        [-6.5, 5],
        [6.5, 5],
        [0, -5],
        [0, 5],
      ];
      const colGeo = new THREE.BoxGeometry(0.6, floorHeight, 0.6);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        wireframe: isWireframe,
      });

      columnPositions.forEach(([cx, cz]) => {
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(cx, floorY + floorHeight / 2, cz);
        col.castShadow = true;
        group.add(col);
      });

      // Individual Rooms & Walls
      const rooms = levelData.rooms || [];
      const numRooms = rooms.length || 4;

      rooms.forEach((room, rIdx) => {
        const angle = (rIdx / numRooms) * Math.PI * 2;
        const rx = Math.cos(angle) * 3.5;
        const rz = Math.sin(angle) * 2.8;

        const rw = 4.8;
        const rd = 4.2;
        const rh = floorHeight - 0.5;

        // Room Wall Shell
        const wallGeo = new THREE.BoxGeometry(rw, rh, rd);
        const roomColor =
          fIdx === 0
            ? rIdx % 2 === 0
              ? 0x2563eb
              : 0x0284c7
            : rIdx % 2 === 0
            ? 0x10b981
            : 0x6366f1;

        const wallMat = new THREE.MeshStandardMaterial({
          color: roomColor,
          transparent: true,
          opacity: isWireframe ? 0.3 : 0.85,
          wireframe: isWireframe,
          roughness: 0.3,
        });

        const roomMesh = new THREE.Mesh(wallGeo, wallMat);
        roomMesh.position.set(rx, floorY + rh / 2 + 0.3, rz);
        roomMesh.castShadow = true;
        roomMesh.receiveShadow = true;
        group.add(roomMesh);

        // Glass Windows on outer faces
        const glassGeo = new THREE.BoxGeometry(rw * 0.5, rh * 0.45, 0.1);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.6,
          roughness: 0.1,
          transmission: 0.9,
        });
        const windowMesh = new THREE.Mesh(glassGeo, glassMat);
        windowMesh.position.set(rx, floorY + rh / 2 + 0.3, rz + rd / 2 + 0.05);
        group.add(windowMesh);
      });
    });

    // Roof Parapet and Terrace Canopy
    const roofY = numFloors * floorHeight;
    const roofGeo = new THREE.BoxGeometry(14.4, 0.35, 11.4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      wireframe: isWireframe,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, roofY + 0.2, 0);
    roof.castShadow = true;
    group.add(roof);

    // Parapet border
    const parapetGeo = new THREE.BoxGeometry(14.4, 0.8, 0.3);
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const parapetFront = new THREE.Mesh(parapetGeo, parapetMat);
    parapetFront.position.set(0, roofY + 0.6, 5.5);
    group.add(parapetFront);
  }, [activeConcept, isWireframe, viewMode]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">2D & 3D Architectural Building Visualizer</h1>
            <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
              <Sparkles className="h-3 w-3 text-blue-600" /> Three.js + Gemini 2.5
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive 3D building exploration, elevation slicing, and 2D room floor plans.
          </p>
        </div>
      </div>

      {/* 3 AI Design Concepts Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {concepts.map((c, idx) => {
          const isSelected = selectedConceptIndex === idx;
          return (
            <div
              key={c.id || idx}
              onClick={() => {
                setSelectedConceptIndex(idx);
                setActiveFloorIndex(0);
              }}
              className={`rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between shadow-sm ${
                isSelected
                  ? "border-blue-600 bg-white ring-2 ring-blue-600/10 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Concept Option {String.fromCharCode(65 + idx)}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 rounded bg-blue-600 text-white px-1.5 py-0.5 text-[9px] font-bold uppercase">
                      <Check className="h-3 w-3" /> Active 3D
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{c.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.tagline}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-blue-600 font-bold">{c.estimatedCost}</span>
                <span className="text-slate-500">{c.builtUpAreaSqFt} sq.ft</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Visualizer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3D Viewport / 2D Canvas */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 flex flex-col justify-between">
          {/* Viewport Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            {/* 3D vs 2D Switcher */}
            <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === "3d"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Box className="h-3.5 w-3.5" />
                <span>3D Elevation</span>
              </button>
              <button
                onClick={() => setViewMode("2d")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === "2d"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>2D Floor Plan</span>
              </button>
            </div>

            {/* 3D Tools (Wireframe, Daylight, Reset) */}
            {viewMode === "3d" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWireframe(!isWireframe)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    isWireframe
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  title="Toggle Structural Wireframe"
                >
                  Wireframe
                </button>
                <button
                  onClick={() => setIsDaylight(!isDaylight)}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
                  title="Toggle Day/Night Lighting"
                >
                  {isDaylight ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Viewport Canvas Container */}
          <div className="relative h-[440px] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
            {viewMode === "3d" ? (
              <>
                <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
                <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] text-slate-300 border border-slate-800 pointer-events-none flex items-center gap-2">
                  <Compass className="h-3 w-3 text-blue-400" />
                  <span>Left-drag to rotate • Scroll to zoom</span>
                </div>
              </>
            ) : (
              /* 2D Architectural Floor Plan Viewer */
              <div className="h-full w-full p-6 flex flex-col justify-between bg-slate-950 blueprint-grid overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-blue-500/30">
                  <div className="font-bold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Compass className="h-4 w-4" />
                    <span>
                      Architectural Floor Plan —{" "}
                      {activeConcept?.floorPlanLevels?.[activeFloorIndex]?.level || "Ground Floor"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Scale: 1:100 (IS Blueprint)</span>
                </div>

                {/* 2D Room Grid Matrix */}
                <div className="grid grid-cols-2 gap-3 my-auto">
                  {(activeConcept?.floorPlanLevels?.[activeFloorIndex]?.rooms || []).map((room, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedRoomName(room.name)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        selectedRoomName === room.name
                          ? "border-blue-500 bg-blue-500/15 shadow-lg ring-1 ring-blue-500"
                          : "border-slate-700 bg-slate-900/80 hover:border-blue-500/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{room.name}</span>
                          <span className="text-[10px] text-blue-400 font-mono font-semibold">
                            {room.dimensions}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{room.areaSqFt} sq.ft</div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Zone: {room.zone}</span>
                        <span className="text-emerald-400">Vastu Compliant</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500 text-right pt-2 border-t border-slate-800">
                  Total Built-up: {activeConcept?.builtUpAreaSqFt} sq.ft • Style: {activeConcept?.architecturalStyle}
                </div>
              </div>
            )}
          </div>

          {/* Floor Elevation Slicing Tabs */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto">
            {(activeConcept?.floorPlanLevels || []).map((f, fIdx) => (
              <button
                key={fIdx}
                onClick={() => setActiveFloorIndex(fIdx)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  activeFloorIndex === fIdx
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.level}
              </button>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Architectural Specification Drawer & Features */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {activeConcept?.architecturalStyle}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{activeConcept?.title}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{activeConcept?.tagline}</p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Est. Construction Cost</span>
                <div className="font-bold text-blue-600 text-sm mt-0.5">{activeConcept?.estimatedCost}</div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Built-up Area</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{activeConcept?.builtUpAreaSqFt} sq.ft</div>
              </div>
            </div>

            {/* Architectural Highlights */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Architectural Highlights
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {(activeConcept?.designHighlights || []).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Structural Specs */}
            {activeConcept?.structuralSpecs && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Engineering Specs</div>
                <div className="text-slate-600">
                  <span className="text-slate-400 font-medium">Grid:</span> {activeConcept.structuralSpecs.columnGrid}
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400 font-medium">Slab:</span> {activeConcept.structuralSpecs.slabThickness}
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400 font-medium">Energy:</span> {activeConcept.structuralSpecs.energyEfficiencyRating}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                alert(`Selected ${activeConcept?.title} as the approved architectural schematic for the project!`);
              }}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-xs transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Approve & Apply Concept Design</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
