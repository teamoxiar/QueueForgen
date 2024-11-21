<template>
  <div ref="container" class="visualizer"></div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { ref, onMounted } from 'vue'

const container = ref<HTMLElement | null>(null)
const objectCount = ref(0)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let objects: THREE.Mesh[] = []

const createStringCurve = (amount: number) => {
  // Amount'a göre karmaşıklık ve büyüklük belirleme
  const complexity = Math.min(10, Math.max(3, Math.log10(parseInt(amount) / 1e6)))
  const size = Math.min(15, Math.max(5, Math.log10(parseInt(amount) / 1e6) * 2))

  const points = []
  const segments = Math.floor(complexity * 10)

  // Sicim yörüngesi oluşturma
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const angle = t * Math.PI * 2 * complexity

    // Helix benzeri hareket
    points.push(new THREE.Vector3(
        Math.cos(angle) * size * (1 + Math.sin(t * Math.PI * 2) * 0.3),
        t * size * 2 - size, // Dikey yayılım
        Math.sin(angle) * size * (1 + Math.sin(t * Math.PI * 2) * 0.3)
    ))
  }

  return new THREE.CatmullRomCurve3(points)
}

const initScene = () => {
  console.log('Initializing scene...')

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a2a)

  camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
  )
  camera.position.set(0, 0, 50)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  if (container.value) {
    container.value.innerHTML = ''
    container.value.appendChild(renderer.domElement)
  }

  // Işıklandırma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const frontLight = new THREE.DirectionalLight(0xffffff, 1)
  frontLight.position.set(10, 10, 10)
  scene.add(frontLight)

  const backLight = new THREE.DirectionalLight(0xffffff, 0.5)
  backLight.position.set(-10, -10, -10)
  scene.add(backLight)

  // Point lights for shine effect
  const colors = [0xff0000, 0x00ff00, 0x0000ff]
  colors.forEach((color, i) => {
    const light = new THREE.PointLight(color, 0.5, 100)
    light.position.set(
        Math.cos(i * Math.PI * 2 / 3) * 20,
        Math.sin(i * Math.PI * 2 / 3) * 20,
        0
    )
    scene.add(light)
  })
}

const createString = (tx: any) => {
  console.log('Creating string for tx:', tx)

  const amount = parseInt(tx.amount) || 1000000
  const curve = createStringCurve(amount)

  // Tüp geometrisi oluşturma
  const geometry = new THREE.TubeGeometry(
      curve,
      128, // tubularSegments - daha yüksek değer daha pürüzsüz
      0.3,  // radius
      8,    // radialSegments
      false // closed
  )

  // Random renk ve parlaklık
  const hue = Math.random()
  const saturation = 0.7 + Math.random() * 0.3 // 0.7-1.0 arası
  const lightness = 0.5 + Math.random() * 0.3   // 0.5-0.8 arası

  const color = new THREE.Color().setHSL(hue, saturation, lightness)

  // Parlak materyal
  const material = new THREE.MeshPhysicalMaterial({
    color: color,
    metalness: 0.8,
    roughness: 0.2,
    transmission: 0.1, // Yarı saydam efekt
    thickness: 0.5,    // Işık geçirgenliği
    envMapIntensity: 1,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2
  })

  const mesh = new THREE.Mesh(geometry, material)

  // Random pozisyon ve rotasyon
  mesh.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40
  )
  mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
  )

  scene.add(mesh)
  objects.push(mesh)
  objectCount.value = objects.length

  // Obje limiti
  if (objects.length > 50) {
    const oldObject = objects.shift()
    if (oldObject) {
      scene.remove(oldObject)
      oldObject.geometry.dispose()
      oldObject.material.dispose()
      objectCount.value = objects.length
    }
  }
}

const animate = () => {
  requestAnimationFrame(animate)

  const time = Date.now() * 0.001

  objects.forEach((obj, index) => {
    // Her obje için farklı rotasyon
    obj.rotation.x += 0.002 * (index % 2 ? 1 : -1)
    obj.rotation.y += 0.003
    obj.rotation.z += 0.001 * (index % 3 ? 1 : -1)

    // Hafif dalgalanma efekti
    obj.position.y += Math.sin(time + index) * 0.02
  })

  // Kamera hareketi
  camera.position.x = Math.sin(time * 0.1) * 50
  camera.position.z = Math.cos(time * 0.1) * 50
  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera)
}

const handleNewTransaction = (tx: any) => {
  console.log('New transaction received:', tx)
  createString(tx)
}

onMounted(() => {
  console.log('Component mounted')
  initScene()
  animate()

  window.addEventListener('resize', () => {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
  })
})

defineExpose({ handleNewTransaction })
</script>

<style scoped>
.visualizer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #0a0a2a;
  z-index: 0;
}

.stats {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 14px;
  z-index: 1000;
}
</style>