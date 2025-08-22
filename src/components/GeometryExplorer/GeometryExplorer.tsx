import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'

export default function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const currentMeshRef = useRef<THREE.Mesh | null>(null)
  const animRef = useRef<number | null>(null)

  // Estados persistentes
  const [wireframe, setWireframe] = useState<boolean>(() => {
    return localStorage.getItem("wireframe") === "true"
  })
  const [autoRotate, setAutoRotate] = useState<boolean>(() => {
    return localStorage.getItem("autoRotate") !== "false"
  })
  const [selectedGeometry, setSelectedGeometry] = useState<string>(() => {
    return localStorage.getItem("selectedGeometry") || "cube"
  })

  // Refs espejo
  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  // Catálogo de geometrías usando useMemo
  const geometries = useMemo(() => ({
    cube: {
      name: 'Cube',
      category: 'Primitivas',
      description: 'Cubo',
      create: () => new THREE.BoxGeometry(1.5, 1.5, 1.5),
      color: '#44aa88'
    },
    sphere: {
      name: 'Sphere',
      category: 'Primitivas',
      description: 'Esfera',
      create: () => new THREE.SphereGeometry(1, 32, 16),
      color: '#FF6B6B'
    },
    plane: {
      name: 'Plane',
      category: 'Primitivas',
      description: 'Plano',
      create: () => new THREE.PlaneGeometry(2, 2),
      color: '#4ECDC4'
    },
    cone: {
      name: 'Cone',
      category: 'Primitivas',
      description: 'Cono',
      create: () => new THREE.ConeGeometry(1, 2, 16),
      color: '#45B7D1'
    },
    cylinder: {
      name: 'Cylinder',
      category: 'Primitivas',
      description: 'Cilindro',
      create: () => new THREE.CylinderGeometry(1, 1, 2, 16),
      color: '#96CEB4'
    },
    torus: {
      name: 'Torus',
      category: 'Primitivas',
      description: 'Toro',
      create: () => new THREE.TorusGeometry(1, 0.3, 16, 64),
      color: '#FFEAA7'
    },
    torusKnot: {
      name: 'Torus Knot',
      category: 'Primitivas',
      description: 'Nudo Toroidal',
      create: () => new THREE.TorusKnotGeometry(1, 0.3, 100, 16),
      color: '#DDA0DD'
    },
    circle: {
      name: 'Circle',
      category: 'Primitivas',
      description: 'Círculo',
      create: () => new THREE.CircleGeometry(1, 32),
      color: '#98D8C8'
    },
    ring: {
      name: 'Ring',
      category: 'Primitivas',
      description: 'Anillo',
      create: () => new THREE.RingGeometry(0.5, 1, 32),
      color: '#F7DC6F'
    },
    icosahedron: {
      name: 'Icosahedron',
      category: 'Poliedros',
      description: 'Icosaedro',
      create: () => new THREE.IcosahedronGeometry(1, 0),
      color: '#BB8FCE'
    },
    dodecahedron: {
      name: 'Dodecahedron',
      category: 'Poliedros',
      description: 'Dodecaedro',
      create: () => new THREE.DodecahedronGeometry(1, 0),
      color: '#85C1E9'
    },
    octahedron: {
      name: 'Octahedron',
      category: 'Poliedros',
      description: 'Octaedro',
      create: () => new THREE.OctahedronGeometry(1, 0),
      color: '#F8C471'
    },
    tetrahedron: {
      name: 'Tetrahedron',
      category: 'Poliedros',
      description: 'Tetraedro',
      create: () => new THREE.TetrahedronGeometry(1, 0),
      color: '#82E0AA'
    }
  }), [])

  // Sync React -> Ref + localStorage
  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
    console.log("🎨 Wireframe actualizado:", wireframe)
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
    console.log("🔄 AutoRotate actualizado:", autoRotate)
  }, [autoRotate])

  useEffect(() => {
    localStorage.setItem("selectedGeometry", selectedGeometry)
    console.log("📐 Geometría seleccionada:", selectedGeometry)
  }, [selectedGeometry])

  useEffect(() => {
    if (!mountRef.current) return
    console.log("🎬 Inicializando escena...")

    // Escena
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Cámara
    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    // Renderer (evitar duplicados)
    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Luces (agregar DESPUÉS de limpiar escena)
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    // Geometría inicial
    const currentGeo = geometries[selectedGeometry as keyof typeof geometries]
    const geometry = currentGeo.create()
    const material = new THREE.MeshPhongMaterial({ 
      color: currentGeo.color, 
      wireframe: wireframeRef.current 
    })
    const mesh = new THREE.Mesh(geometry, material)
    currentMeshRef.current = mesh
    scene.add(mesh)

    // Helpers
    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

    // Animación
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (autoRotateRef.current && currentMeshRef.current) {
        currentMeshRef.current.rotation.x += 0.01
        currentMeshRef.current.rotation.y += 0.015
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      const w = rect.width || 800
      const h = rect.height || 600
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      console.log("🧹 Limpiando escena...")
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      scene.clear()
    }
  }, [selectedGeometry, geometries])

  // Wireframe dinámico
  useEffect(() => {
    const mesh = currentMeshRef.current
    if (!mesh) return
    const mat = mesh.material as THREE.MeshPhongMaterial
    mat.wireframe = wireframe
    mat.needsUpdate = true
    console.log("✅ Wireframe aplicado:", wireframe)
  }, [wireframe])

  // Función para cambiar geometría
  const changeGeometry = (geoKey: string) => {
    if (!sceneRef.current || !currentMeshRef.current) return
    
    const newGeo = geometries[geoKey as keyof typeof geometries]
    if (!newGeo) return

    // Limpiar geometría anterior
    const oldGeometry = currentMeshRef.current.geometry
    oldGeometry.dispose()

    // Crear nueva geometría
    const geometry = newGeo.create()
    const material = currentMeshRef.current.material as THREE.MeshPhongMaterial
    material.color.set(newGeo.color)
    
    currentMeshRef.current.geometry = geometry
    setSelectedGeometry(geoKey)
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Canvas Three.js */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Panel lateral de geometrías */}
      <div style={{ 
        position: 'absolute', 
        left: 12, 
        top: 12, 
        background: 'rgba(0,0,0,0.8)', 
        padding: '16px',
        borderRadius: '8px',
        color: 'white',
        maxHeight: '80vh',
        overflowY: 'auto',
        minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>📐 Geometrías</h3>
        
        {/* Geometrías */}
        {Object.entries(geometries).map(([key, geo]) => (
          <button
            key={key}
            onClick={() => changeGeometry(key)}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              margin: '4px 0',
              background: selectedGeometry === key ? geo.color : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = selectedGeometry === key ? geo.color : 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = selectedGeometry === key ? geo.color : 'rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{geo.name}</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>{geo.description}</div>
          </button>
        ))}
      </div>

      {/* Controles UI */}
      <div style={{ position: 'absolute', right: 12, top: 12, display: 'grid', gap: 8 }}>
        <button 
          onClick={() => setAutoRotate(!autoRotate)}
          style={{
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.8)',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
        </button>
        <button 
          onClick={() => setWireframe(!wireframe)}
          style={{
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.8)',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
        </button>
      </div>

      {/* Información de la geometría actual */}
      <div style={{ 
        position: 'absolute', 
        bottom: 12, 
        left: 12, 
        background: 'rgba(0,0,0,0.8)', 
        padding: '12px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px'
      }}>
        <div>📐 Geometría actual: <strong>{geometries[selectedGeometry as keyof typeof geometries]?.name}</strong></div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {geometries[selectedGeometry as keyof typeof geometries]?.description}
        </div>
      </div>
    </div>
  )
}