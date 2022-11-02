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
import "./style.css"
import Tween from '@tweenjs/tween.js'

//定义变量
let camera, scene, composer, bloomPass, control, renderer, raycaster
let clock, model, skeleton, mixer, action, mouse
let RGBshiftShader, tween, animations, environmentMapTexture, earthenvironmentMapTexture
let action1, action2, action3, action4, actionState
let actionChanging = true

//资源加载管理
const manager = new THREE.LoadingManager();
manager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};
//资源加载完成
manager.onLoad = function () {
    init()
    console.log('Loading complete!');
};
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};
manager.onError = function (url) {
    console.log('There was an error loading ' + url);
};


window.addEventListener('click', (event) => {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersection = raycaster.intersectObject(model);
    if (intersection.length > 0 & !actionChanging) {
        actionState = !actionState
        if (actionState) {
            actionChanging = true
            action1.stop()
            action2.stop()
            action3.stop()
            action4.play()
        } else {
            actionChanging = true
            action1.stop()
            action2.stop()
            action3.play()
            action4.stop()
        }
    }

})

// 调试参数
const params = {
    RGBshiftShaderp: 0.0015,
    emissiveIntensity: 1,
    toneMappingExposure: 1.5,
    cameraX: 0,
    cameraY: 40,
    cameraZ: -2,
}

//加载资源
load()

//初始化场景函数
function init() {
    //获取页面容器位置
    const container = document.getElementById('app');
    //定义相机
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 2, 500);
    //初始化相机位置
    camera.position.set(0, 40, -2);
    //初始化相机朝向
    camera.lookAt(0, 0, 0);
    //初始化时钟（动画用）
    clock = new THREE.Clock();
    //初始化场景
    scene = new THREE.Scene();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(0, 0)
    //定义灯光
    //点光
    const pointLight = new THREE.PointLight(0xff2e1f, 1, 10);
    pointLight.position.set(3, 3, 3);
    scene.add(pointLight);
    const pointLight1 = new THREE.PointLight(0x1dbaff, 5, 10);
    pointLight1.position.set(-3, -3, 3);
    const AmbientLight = new THREE.AmbientLight(0xffffff, 1);
    AmbientLight.position.set(0, 20, 0);
    scene.add(AmbientLight);
    const dirLight = new THREE.DirectionalLight(0xffdfcb, 10);
    dirLight.position.set(-3, 10, -10);
    scene.add(dirLight);
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
    control.enablePan = false
    container.appendChild(renderer.domElement);
    //调试ui
    gui()
    //开场镜头动画
    tween = new Tween.Tween(camera.position)

    tween.to({x: -16.8, y: 28.6, z: -24.6}, 1166.67)
        .easing(Tween.Easing.Linear.None)
        .delay(100)
        .onComplete(() => {
            new Tween.Tween(camera.position).to({
                x: -22.785,
                y: 14.178,
                z: -9.6
            }, 4333.3)
                .start()
        })

    //场景修改
    scene.add(skeleton);
    scene.add(model);
    model.children[0].children[1].material.envMap = environmentMapTexture
    model.children[0].children[2].material.envMap = environmentMapTexture
    model.children[0].children[3].material.envMap = environmentMapTexture
    model.children[0].children[5].children[0].material.envMap = environmentMapTexture
    model.children[0].children[5].children[1].material.envMap = earthenvironmentMapTexture
    model.children[0].children[5].children[2].material.envMap = earthenvironmentMapTexture
    model.children[0].children[1].material.envMapIntensity = 0.4
    model.children[0].children[2].material.envMapIntensity = 0.4
    model.children[0].children[3].material.envMapIntensity = 0.4
    model.children[0].children[5].children[2].material.envMapIntensity = 5
    scene.background = earthenvironmentMapTexture
    animate()
    tween.start()
    action3.play()


}

//调试ui
function gui() {
    // const panel = new GUI({width: 300});
    // panel.add(params, 'RGBshiftShaderp', 0.0, 0.01, 0.0001).onChange(v => {
    //     RGBshiftShader.uniforms['amount'].value = v
    // });
    // panel.add(params, 'emissiveIntensity', 0.0, 1, 0.01).onChange(v => {
    //     model.children[0].children[4].children[0].material.emissiveIntensity = v
    //     model.children[0].children[4].children[1].material.emissiveIntensity = v
    //     model.children[0].children[4].children[2].material.emissiveIntensity = v
    //     model.children[0].children[1].material.emissiveIntensity = v
    //     model.children[0].children[2].material.emissiveIntensity = v
    //     model.children[0].children[3].material.emissiveIntensity = v
    // });
    // panel.add(params, 'toneMappingExposure', 0.0, 5, 0.01).onChange(v => {
    //     renderer.toneMappingExposure = v
    // });
}

function load() {
    //材质加载器
    const cubeTextureLoader = new THREE.CubeTextureLoader(manager)
    //加载环境贴图
    environmentMapTexture = cubeTextureLoader.load([
        '/texture/envcube/px.png',
        '/texture/envcube/nx.png',
        '/texture/envcube/py.png',
        '/texture/envcube/ny.png',
        '/texture/envcube/pz.png',
        '/texture/envcube/nz.png',
    ])
    earthenvironmentMapTexture = cubeTextureLoader.load([
        '/texture/earthmap/px.png',
        '/texture/earthmap/nx.png',
        '/texture/earthmap/py.png',
        '/texture/earthmap/ny.png',
        '/texture/earthmap/pz.png',
        '/texture/earthmap/nz.png',
    ])
    earthenvironmentMapTexture.encoding = THREE.sRGBEncoding
    environmentMapTexture.encoding = THREE.sRGBEncoding
    //初始化GLTF加载器
    const loader = new GLTFLoader(manager);
    const dracoLoader = new DRACOLoader(manager);
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);
    //读取模型
    loader.load('/model/fengzheng2.glb', function (gltf) {
        //读取模型
        model = gltf.scene;
        //读取动画
        animations = gltf.animations;
        //读取骨骼
        skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        //初始化动画混合器
        mixer = new THREE.AnimationMixer(model);
        //动画回调函数
        mixer.addEventListener('finished', (e) => {
            actionChanging = false
            const actionName = e.action._clip.name
            if (actionName === 'bianxing-f') {
                action1.play()
            } else if (actionName === 'bianxing') {
                action2.play()
            }
            console.log(e.action._clip.name)
        })
        mixer.addEventListener('loop',e=>{
            console.log(e)
        })

        //风筝状态
        action1 = mixer.clipAction(animations[0]);
        //天宫状态
        action2 = mixer.clipAction(animations[1]);
        //风筝-》天宫
        action3 = mixer.clipAction(animations[2]);
        action3.loop = THREE.LoopOnce
        //天宫-》风筝
        action4 = mixer.clipAction(animations[3]);
        action4.loop = THREE.LoopOnce

    });
}

function animate() {
    // Render loop
    requestAnimationFrame(animate);
    if (mixer) {
        mixer.update(clock.getDelta())
    }
    Tween.update()
    control.update()
    composer.render()
}