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
import {func, mod} from "three/nodes";

/*
==============定义变量=================
*/
let camera, scene, composer, bloomPass, control, renderer, raycaster
let RGBshiftShader, environmentMapTexture, earthenvironmentMapTexture,earthenvironmentMapTexture2
//动画相关变量
let clock, model, skeleton, mixer, action,tween,mouse,animations
//动画变量，形态状态
let action1, action2, action3, action4, actionState
//是否正在变形中
let actionChanging = true
//画布长宽
let width = window.innerWidth<window.innerHeight?window.innerWidth:window.innerHeight
let height = window.innerWidth<window.innerHeight?window.innerWidth:window.innerHeight
/*
==============资源加载管理=================
*/
const manager = new THREE.LoadingManager();
manager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};
//资源加载完成
manager.onLoad = function () {
    document.getElementById("loading").remove()
    //加载完成开始初始化场景
    init()
    console.log('Loading complete!');
};
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};
manager.onError = function (url) {
    console.log('There was an error loading ' + url);
};
//触摸、点击事件
window.addEventListener('touchstart', event=>{handlechange(event)})
window.addEventListener('click', event=>{handlechange(event)})

function handlechange(event){
    event.preventDefault();
    if(event.type==="touchstart"){

    mouse.x = (event.targetTouches[0].clientX / width) * 2 - 1;
    mouse.y = -(event.targetTouches[0].clientY / height) * 2 + 1;
    }else{
        mouse.x = (event.clientX / width) * 2 - 1;
        mouse.y = -(event.clientY / height) * 2 + 1;
    }
    raycaster.setFromCamera(mouse, camera);
    const intersection = raycaster.intersectObject(model);
    if (intersection.length > 0 & !actionChanging) {
        actionState = !actionState
        if (actionState) {
            actionChanging = true
            action4.play()
            action2.stop()
        } else {
            actionChanging = true
            action3.play()
            action1.stop()
        }
    }
}
/*
==============调试=================
*/
// 调试参数（忽视）
const params = {
    RGBshiftShaderp: 0.0015,
    emissiveIntensity: 1,
    toneMappingExposure: 1.2,
    cameraX: 0,
    cameraY: 40,
    cameraZ: -2,
}
//调试ui（忽视）
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
/*
==============定义函数=================
*/
//初始化场景函数
function init() {
    //获取页面容器位置
    const container = document.getElementById('app');
    //定义相机
    camera = new THREE.PerspectiveCamera(40, width / height, 2, 500);
    //初始化相机位置
    camera.position.set(0, 0, -65);
    //初始化相机朝向
    camera.lookAt(0, 0, 0);
    //初始化时钟（动画用）
    clock = new THREE.Clock();
    //初始化场景
    scene = new THREE.Scene();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(0, 0)
    //点光
    // const pointLight = new THREE.PointLight(0xff2e1f, 1, 10);
    // pointLight.position.set(3, 3, 3);
    // scene.add(pointLight);
    // const pointLight1 = new THREE.PointLight(0x1dbaff, 5, 10);
    // pointLight1.position.set(-3, -3, 3);
    //环境光
    const AmbientLight = new THREE.AmbientLight(0xffffff, 1);
    AmbientLight.position.set(10, 20, 10);
    scene.add(AmbientLight);
    const dirLight = new THREE.DirectionalLight(0xffdfcb, 10);
    dirLight.position.set(-3, 10, -10);
    scene.add(dirLight);
    //初始化渲染器
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    //画布尺寸
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = params.toneMappingExposure
    // 后处理效果
    composer = new EffectComposer(renderer);
    const renderScene = new RenderPass(scene, camera);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
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
    control.minDistance = 35;
    control.maxDistance = 65;
    control.maxPolarAngle = Math.PI * 0.7;
    control.enablePan = false
    //canve绑定到网页元素
    container.appendChild(renderer.domElement);
    //调试ui
    gui()
    //开场镜头动画

    tween = new Tween.Tween(camera.position)
    // tween.to({x: -16.8, y: 28.6, z: -24.6}, 1166.67)
    tween.to({x: 0, y: 40, z: -2}, 1166.67)
        .easing(Tween.Easing.Linear.None)
        .delay(100)
        .onComplete(() => {
            const a = 1.5
            new Tween.Tween(camera.position).to({
                x: -34.7568,
                y: 25.39,
                z: -34.236
            }, 4333.3)
                .start()
        })
    //场景修改
    scene.add(skeleton);
    scene.add(model);
    console.log(model)
    model.children[0].children[1].material.envMap = environmentMapTexture
    model.children[0].children[2].material.envMap = environmentMapTexture
    model.children[0].children[4].material.envMap = earthenvironmentMapTexture2
    model.children[0].children[1].material.envMapIntensity = 0.4
    model.children[0].children[2].material.envMapIntensity = 0.4
    model.children[0].children[3].material.envMapIntensity = 0.4
    model.children[0].children[4].material.emissiveIntensity = 1
    model.children[0].children[3].material.emissiveIntensity = 1
    model.children[0].children[2].material.emissiveIntensity = 1

    // model.children[0].children[4].children[2].material.envMapIntensity = 5
    scene.background = earthenvironmentMapTexture
    //开始动画
    tween.start()
    action3.play()
    animate()
}
//资源加载函数
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
    earthenvironmentMapTexture2 = cubeTextureLoader.load([
        '/texture/earthmapb/px.png',
        '/texture/earthmapb/nx.png',
        '/texture/earthmapb/py.png',
        '/texture/earthmapb/ny.png',
        '/texture/earthmapb/pz.png',
        '/texture/earthmapb/nz.png',
    ])
    earthenvironmentMapTexture.encoding = THREE.sRGBEncoding
    environmentMapTexture.encoding = THREE.sRGBEncoding
    //初始化GLTF加载器
    const loader = new GLTFLoader(manager);
    const dracoLoader = new DRACOLoader(manager);
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);
    //读取模型
    loader.load('/model/zhuqingting.glb', function (gltf) {
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
                action4.stop()
            } else if (actionName === 'bianxing') {
                // setWeight(2)
                action2.play()
                action3.stop()
            }
        })
        //风筝状态
        action1 = mixer.clipAction(animations[3]);
        //天宫状态
        action2 = mixer.clipAction(animations[2]);
        //风筝-》天宫
        action3 = mixer.clipAction(animations[0]);
        action3.clampWhenFinished = true
        action3.loop =  THREE.LoopOnce
        //天宫-》风筝
        action4 = mixer.clipAction(animations[1]);
        action4.clampWhenFinished = true
        action4.loop =  THREE.LoopOnce
    });
}
//动画循环函数
function animate() {
    requestAnimationFrame(animate);
    // 动画更新
    if (mixer) {
        mixer.update(clock.getDelta())
    }
    //初始镜头动画
    Tween.update()
    control.update()
    composer.render()
}

/*
===============================
*/
load()

