import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/addons/loaders/DRACOLoader.js";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {RGBShiftShader} from "three/examples/jsm/shaders/RGBShiftShader";
import {DotScreenShader} from "three/addons/shaders/DotScreenShader.js";
import {GUI} from "dat.gui";
import studio from '@theatre/studio'
import {getProject, types} from '@theatre/core'
import "./style.css"

// Initialize the studio
studio.initialize()

// Create a project for the animation
const project = getProject('fengzheng')
// Create a sheet
const sheet = project.sheet('Animated scene')
//定义变量
let camera, scene, composer, bloomPass, control, renderer
let clock, model, skeleton, mixer, action
let RGBshiftShader
// 调试参数
const params = {
    RGBshiftShaderp: 0.0015,
    emissiveIntensity: 1,
    toneMappingExposure: 1.5
}


//材质加载器
const cubeTextureLoader = new THREE.CubeTextureLoader()

//加载环境贴图
const environmentMapTexture = cubeTextureLoader.load([
    '/texture/envcube/px.png',
    '/texture/envcube/nx.png',
    '/texture/envcube/py.png',
    '/texture/envcube/ny.png',
    '/texture/envcube/pz.png',
    '/texture/envcube/nz.png',
])
const earthenvironmentMapTexture = cubeTextureLoader.load([
    '/texture/earthmap/px.png',
    '/texture/earthmap/nx.png',
    '/texture/earthmap/py.png',
    '/texture/earthmap/ny.png',
    '/texture/earthmap/pz.png',
    '/texture/earthmap/nz.png',
])

earthenvironmentMapTexture.encoding = THREE.sRGBEncoding
environmentMapTexture.encoding = THREE.sRGBEncoding
//初始化场景
init()
const cameraObj = sheet.object('camera', {
    // Note that the rotation is in radians
    // (full rotation: 2 * Math.PI)
    position: {
        x: types.number(0, {range: [-40, 40]}),
        y: types.number(0, {range: [-40, 40]}),
        z: types.number(0, {range: [-40, 40]})
    }
})
cameraObj.onValuesChange((values) => {
    const {x, y, z} = values.position
    camera.position.set(x, y, z)
})

//初始化场景函数
function init() {
    //获取页面容器位置
    const container = document.getElementById('app');
    //定义相机
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 2, 500);
    //初始化相机位置
    camera.position.set(0, 2, -20);
    //初始化相机朝向
    camera.lookAt(0, 0, 0);
    //初始化时钟（动画用）
    clock = new THREE.Clock();
    //初始化场景
    scene = new THREE.Scene();
    scene.background = earthenvironmentMapTexture

    //定义灯光
    //点光
    const pointLight = new THREE.PointLight(0xff2e1f, 1, 10);
    pointLight.position.set(3, 3, 3);
    scene.add(pointLight);
    // const sphereSize = 1;
    // const pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize );
    // scene.add( pointLightHelper );
    const pointLight1 = new THREE.PointLight(0x1dbaff, 5, 10);
    pointLight1.position.set(-3, -3, 3);
    // scene.add( pointLight1 );
    // const pointLightHelper1 = new THREE.PointLightHelper( pointLight1, sphereSize );
    // scene.add( pointLightHelper1 );


    const AmbientLight = new THREE.AmbientLight(0xffffff, 1);
    AmbientLight.position.set(0, 20, 0);
    scene.add(AmbientLight);

    const dirLight = new THREE.DirectionalLight(0xffdfcb, 10);
    dirLight.position.set(-3, 10, -10);
    scene.add(dirLight);

    //加载模型
    load()
    //初始化渲染器
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = params.toneMappingExposure
    // 后处理效果
    composer = new EffectComposer(renderer);
    const renderScene = new RenderPass(scene, camera);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    RGBshiftShader = new ShaderPass(RGBShiftShader);
    RGBshiftShader.uniforms['amount'].value = params.RGBshiftShaderp;
    const DotScreen = new ShaderPass(DotScreenShader);
    DotScreen.uniforms['scale'].value = 4;
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    // composer.addPass(DotScreen);
    composer.addPass(RGBshiftShader);
    //相机控制器
    control = new OrbitControls(camera, renderer.domElement)
    control.enableDamping = true;
    control.minDistance = 3;
    control.maxDistance = 40;
    control.maxPolarAngle = Math.PI * 0.7;
    container.appendChild(renderer.domElement);
    //调试ui
    gui()
    //动画循环
    animate()
}

//调试ui
function gui() {
    const panel = new GUI({width: 300});


    panel.add(params, 'RGBshiftShaderp', 0.0, 0.01, 0.0001).onChange(v => {
        RGBshiftShader.uniforms['amount'].value = v
    });
    panel.add(params, 'emissiveIntensity', 0.0, 1, 0.01).onChange(v => {
        model.children[0].children[4].children[0].material.emissiveIntensity = v
        model.children[0].children[4].children[1].material.emissiveIntensity = v
        model.children[0].children[4].children[2].material.emissiveIntensity = v
        model.children[0].children[1].material.emissiveIntensity = v
        model.children[0].children[2].material.emissiveIntensity = v
        model.children[0].children[3].material.emissiveIntensity = v
    });
    panel.add(params, 'toneMappingExposure', 0.0, 5, 0.01).onChange(v => {
        renderer.toneMappingExposure = v
    });
}

function load() {
    //初始化GLTF加载器
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);
    //读取模型
    loader.load('/model/fengzheng.glb', function (gltf) {
        model = gltf.scene;

        model.children[0].children[1].material.envMap = environmentMapTexture
        model.children[0].children[2].material.envMap = environmentMapTexture
        model.children[0].children[3].material.envMap = environmentMapTexture
        // model.children[0].children[4].children[0].material.envMap = environmentMapTexture
        // model.children[0].children[4].children[1].material.envMap = earthenvironmentMapTexture
        model.children[0].children[4].children[2].material.envMap = earthenvironmentMapTexture
        model.children[0].children[1].material.envMapIntensity = 0.4
        model.children[0].children[2].material.envMapIntensity = 0.4
        model.children[0].children[3].material.envMapIntensity = 0.4
        model.children[0].children[4].children[2].material.envMapIntensity = 5

        //读取动画骨骼
        skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        scene.add(skeleton);
        //读取动画
        const animations = gltf.animations;
        //初始化动画混合器
        mixer = new THREE.AnimationMixer(model);
        action = mixer.clipAction(animations[2]);
        action.play()
        //添加到场景
        scene.add(gltf.scene);
    });
}

function animate() {
    // Render loop
    requestAnimationFrame(animate);
    if (mixer) {
        mixer.update(clock.getDelta())
    }
    control.update()
    composer.render();
}