import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 360 })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const bakedTexture1 = textureLoader.load('b1-baked.jpg')
bakedTexture1.flipY = false
bakedTexture1.colorSpace = THREE.SRGBColorSpace

const bakedTexture2 = textureLoader.load('b2-baked.jpg')
bakedTexture2.flipY = false
bakedTexture2.colorSpace = THREE.SRGBColorSpace

const bakedTexture3 = textureLoader.load('b3-baked.jpg')
bakedTexture3.flipY = false
bakedTexture3.colorSpace = THREE.SRGBColorSpace

const bakedTexture4 = textureLoader.load('b4-baked.jpg')
bakedTexture4.flipY = false
bakedTexture4.colorSpace = THREE.SRGBColorSpace

const bakedTexture5 = textureLoader.load('b5-baked.jpg')
bakedTexture5.flipY = false
bakedTexture5.colorSpace = THREE.SRGBColorSpace

/**
 * Materials
 */
// Baked material
const b1Material = new THREE.MeshBasicMaterial({ map: bakedTexture1 })

const b2Material = new THREE.MeshBasicMaterial({ map: bakedTexture2 })

const b3Material = new THREE.MeshBasicMaterial({ map: bakedTexture3 })

const b4Material = new THREE.MeshBasicMaterial({ map: bakedTexture4 })

const b5Material = new THREE.MeshBasicMaterial({ map: bakedTexture5 })

/**
 * Model
 */
gltfLoader.load(
    'spacestation-1.glb',
    (gltf) =>
    {
        gltf.scene.traverse((child) =>
        {
            child.material = b1Material
        })
        scene.add(gltf.scene)
    }
)

gltfLoader.load(
    'spacestation-2.glb',
    (gltf) =>
    {
        gltf.scene.traverse((child) =>
        {
            child.material = b2Material
        })
        scene.add(gltf.scene)
    }
)

gltfLoader.load(
    'spacestation-3.glb',
    (gltf) =>
    {
        gltf.scene.traverse((child) =>
        {
            child.material = b3Material
        })
        scene.add(gltf.scene)
    }
)

gltfLoader.load(
    'spacestation-4.glb',
    (gltf) =>
    {
        gltf.scene.traverse((child) =>
        {
            child.material = b4Material
        })
        scene.add(gltf.scene)
    }
)

gltfLoader.load(
    'spacestation-5.glb',
    (gltf) =>
    {
        gltf.scene.traverse((child) =>
        {
            child.material = b5Material
        })
        scene.add(gltf.scene)
    }
)

/**
 * Galaxy
 */
const parameters = {}
parameters.count = 300000
parameters.size = 0.01
parameters.radius = 10
parameters.branches = 5
parameters.spin = 3.3
parameters.randomness = 0.2
parameters.randomnessPower = 1.7
parameters.insideColor = '#ff6030'
parameters.outsideColor = '#1b3984'

let geometry = null
let material = null
let points = null

const generateGalaxy = () =>
{
    /**
     * Destroy old galaxy
     */
    if(points !== null)
    {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    const scales = new Float32Array(parameters.count * 1)
    const randomness = new Float32Array(parameters.count * 3)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    for(let i = 0; i < parameters.count; i++)
    {
        const i3 = i * 3

        // Position
        const radius = Math.random() * parameters.radius
        const spinAngle = radius * parameters.spin
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

        positions[i3    ] = Math.cos(branchAngle + spinAngle) * radius
        positions[i3 + 1] = 0
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius

        // Randomness
        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1)
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1)
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1)

        randomness[i3 + 0] = randomX
        randomness[i3 + 1] = randomY
        randomness[i3 + 2] = randomZ

        // Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / parameters.radius)

        colors[i3    ] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b

        // Scale
        scales[i] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))

    /**
     * Material
     */
    material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        vertexShader: `
            uniform float uTime;
            uniform float uSize;

            attribute float aScale;
            attribute vec3 aRandomness;

            varying vec3 vColor;

            void main()
            {
                /**
                 * Position
                 */
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);

                // Spin
                float angle = atan(modelPosition.x, modelPosition.z);
                float distanceToCenter = length(modelPosition.xz);
                float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
                angle += angleOffset;
                modelPosition.x = cos(angle) * distanceToCenter;
                modelPosition.z = sin(angle) * distanceToCenter;

                // Randomness
                modelPosition.xyz += aRandomness;

                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectedPosition = projectionMatrix * viewPosition;
                gl_Position = projectedPosition;
            
                /**
                 * Size
                 */
                gl_PointSize = uSize * aScale;
                gl_PointSize *= (1.0 / - viewPosition.z);

                /**
                 * Color
                 */
                vColor = color;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;

            void main()
            {
                // // Disc
                // float strength = distance(gl_PointCoord, vec2(0.5));
                // strength = step(0.5, strength);
                // strength = 1.0 - strength;

                // // Difuse point
                // float strength = distance(gl_PointCoord, vec2(0.5));
                // strength *= 2.0;
                // strength = 1.0 - strength;

                // Light point
                float strength = distance(gl_PointCoord, vec2(0.5));
                strength = 1.0 - strength;
                strength = pow(strength, 10.0);

                // Final color
                vec3 color = mix(vec3(0.0), vColor, strength);

                gl_FragColor = vec4(color, 1.0);
                #include <colorspace_fragment>
            }
        `,
        uniforms:
        {
            uTime: { value: 0 },
            uSize: { value: 30 * renderer.getPixelRatio() }
        }
    })

    /**
     * Points
     */
    points = new THREE.Points(geometry, material)
    scene.add(points)
}

gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
gui.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
gui.add(parameters, 'spin').min(- 5).max(5).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 9
camera.position.y = 3.7
camera.position.z = 5.8
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.autoRotate = true;
controls.rotateSpeed = 0.25;
controls.maxDistance = 20.5;
controls.autoRotateSpeed *= -0.002;
 
controls.update();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Generate galaxy
 */
generateGalaxy()

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update material
    material.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()