import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Raycaster, StaticCopyUsage } from "three";
import { gsap } from "gsap";
import Stats from "stats.js";

/**
 * LOADERS / HTML Element fetchers
 */

let sceneReady = false; // for showing/hiding elements before scene is ready
let statspanelBoolean = false
const loadingBarElement = document.querySelector(".loading-bar"); // loading bar DOM element
const errorPage = document.querySelector(".errorScreen"); // error screen DOM element
const initialText = document.querySelector(".initialText"); // initial text DOM element
const infoText = document.querySelector(".info"); // info text DOM element
const aboutText = document.querySelector(".about"); // about text DOM element
const pointsElement = document.querySelector(".points"); //points div dom element


//loading manager providing 3 states. Loading/Loaded/Error. (For all WEBGL assets)
const loadingManager = new THREE.LoadingManager(
    //assets Loaded
  () => {
     //gsap to animate black blocking shader
     gsap.to(overlayMaterial.uniforms.uAlpha, {
      duration: 3,
      value: 0,
      delay: 1,
    });

    
    //time out of 500 seconds for progress bar to reach right side of the screen due to css transition easing of 0.500ms
      window.setTimeout(() => {
      console.log("SCENE LOADED"); // logs all assets loaded

      //class list to trigger CSS transform:ended
      loadingBarElement.classList.add("ended");
      loadingBarElement.style.transform = "";
      initialText.style.color = "rgba(0, 255, 26, 0.847)";

      //trigger to hide initial text
    }, 500);
    window.setTimeout(() => {
      initialText.style.visibility = "hidden";

      //trigger to hide initial text
    }, 2000);


//moves shader
    window.setTimeout(() => {
      sceneReady = true;

      gsap.to(controls.target, {
        duration: 5,
        x: 5.12,
        y: -2.59,
        z: 0.46
        });
  
    gsap.to(camera.position, {
        duration: 5,
        x:-5.08, 
        y: 1.56, 
        z: 0.43
        });
    }, 8000);
  },

  // Loading assets

  (itemUrl, itemsLoaded, itemsTotal) => {
    //logs URL of asset, how many loaded and how many assets to load
    
    console.log("SCENE PROGRESS"); // one console log for each asset that is loaded

    console.log(itemUrl, itemsLoaded, itemsTotal);
    const progressRatio = itemsLoaded / itemsTotal; //load ratio
    //provides normalized value (0.0 to 1.0 ) to the ScaleX css transform

    //applying to css "transform scaleX"
    loadingBarElement.style.transform = `scaleX(${progressRatio})`;

  },

  //ERROR - returns when there is a error in loading/displaying or anything WBEGL related.

  () => {
    console.log("FATAL ERROR");
    errorPage.style.visibility = "visible";
    console.log("LOADING HAS FAILED");
    //this displays a error message on the user screen
  }
);

// Loading WEBGL canvas
const canvas = document.querySelector("canvas.webgl");

// Setting WEBGL Scene
const scene = new THREE.Scene();

//Fetching Model Loader // need to provide loading manager to interact.
const gltfLoader = new GLTFLoader(loadingManager);
//Fetching 3D env map loader
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);
//Fetching Loading Bar DOM element

/**
 * Debugger / controls panel
 */
let guiwidth = window.innerWidth / 3;
const gui = new dat.GUI({ width: guiwidth });

let pointsHidden = false;
let orbitDisabled = false;
let infoHidden = false;
let aboutHidden = true;
let autoRotating = true;

//GUI for Technical controls - Folder panel
const TechnicalGUI = gui.addFolder ('Developer/Technical Settings')
TechnicalGUI.close(); // starts gui folder closed

const debugObject = {  //object containing all the functions to show and hide elements

  hideInfo: function () {

    if (infoHidden == false) { // instructions points toggle
        infoText.style.visibility = "hidden";
        infoHidden = true;
      } else {
        infoText.style.visibility = "visible";
        infoHidden = false;
      }
  },
  aboutInfo: function () {

    if (aboutHidden == false) { //about panel toggle
        aboutText.style.visibility = "hidden";
        aboutHidden = true;
      } else {
        aboutText.style.visibility = "visible";
        aboutHidden = false;
      }

  },
  disablePoints: function () {
    if (pointsHidden == false) { // interest points toggle
      pointsElement.style.visibility = "hidden";
      pointsHidden = true;
    } else {
      pointsElement.style.visibility = "visible";
      pointsHidden = false;
    }
  },

  disableOrbit: function () { //orbit controls toggle
    if (orbitDisabled == false) {

      controls.enabled = false;
      orbitDisabled = true;
      alert("YOU HAVE DISABLED ORBIT/MOUSE/FINGER CONTROLS");

    } else {

      controls.enabled = true;
      orbitDisabled = false;
      alert("YOU HAVE ENABLED ORBIT/MOUSE/FINGER CONTROLS");

    }
  },

  toggleAutorotate: function () {
    

    if (autoRotating == true) { // toggle auto rotation
        controls.autoRotate = false
        autoRotating = false;
      } else {
        controls.autoRotate = true
        autoRotating = true;
      }
  }


};

gui.close(); // collaping the whole control panel

//adding toggle function buttons to the control panel
gui.add(debugObject, "hideInfo").name("Toggle Instructions"); 

gui.add(debugObject, "aboutInfo").name("Toggle About");
gui.add(debugObject, "disablePoints").name("Toggle Info Points");
gui.add(debugObject, "disableOrbit").name("Toggle Orbit Controls")
gui.add(debugObject, "toggleAutorotate").name("Toggle Auto Rotation");


/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  // wireframe: true,
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 },
  },
  //loading screen shader (cover as stuff loads)
  vertexShader: ` 
         void main()
         {
             gl_Position = vec4(position, 1.0);
         }
     `,
  fragmentShader: `
         uniform float uAlpha;
 
         void main()
         {
             gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
         }
     `,
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

/**
 * Updating all materials of the mesh with relation to the EnvMap
 */

const updateAllMaterials = () => {

  //checks the childs of all parents (all 33 ~ objects)

  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};


//Env map - for lighting 
const environmentMap = cubeTextureLoader.load([
  "EnvMap/nx.jpg",
  "Envmap/nx.jpg",
  "Envmap/py.jpg",
  "Envmap/ny.jpg",
  "Envmap/pz.jpg",
  "Envmap/nz.jpg",
]);

environmentMap.encoding = THREE.sRGBEncoding;

//application to the background
// scene.background = environmentMap; // used for testing env map
scene.environment = environmentMap;
//but just loading it will not affect the model just yet

//this is for the intensity level that is placed/effected on the model
debugObject.envMapIntensity = 2.5;

//Putting the EnvMapIntensity value in the Technical controls panel
TechnicalGUI
  .add(debugObject, "envMapIntensity")
  .min(0.5)
  .max(10)
  .step(0.001)
  .onChange(() => {
    updateAllMaterials();
  })
  .name("Environment Intensity");


/**
 * Loading/initiating the model
 */

gltfLoader.load(

  "models/DigitalSSISv5.glb", //scene.glb 5MB

  (gltf) => {

    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.position.set(0, -4, 0);
    gltf.scene.rotation.y = Math.PI * 0.5;
    
    scene.add(gltf.scene);

    updateAllMaterials();

    //model rotation values for modification in controls panel (Technical)
    TechnicalGUI
      .add(gltf.scene.rotation, "y") // Model Y rotation
      .min(-Math.PI)
      .max(Math.PI)
      .step(0.001)
      .name("Model Rotation");

      TechnicalGUI
      .add(gltf.scene.position, "x")  // Model X position 
      .min(-10)
      .max(10)
      .step(0.001)
      .name("Model X");
      TechnicalGUI
      .add(gltf.scene.position, "y") // Model X position 
      .min(-5)
      .max(-1)
      .step(0.001)
      .name("Model Y");
      TechnicalGUI
      .add(gltf.scene.position, "z") // Model X position 
      .min(-5)
      .max(5)
      .step(0.001)
      .name("Model Z");
  }
);

/**
 * Info Points 
 */

//raycaster initiated
  //for casting out points and lines for checking if model intersects
    //how many times etc...
const raycaster = new Raycaster(); // used for hiding/showing the interest points 

//interest points vector locations 
const points = [
  {
    position: new THREE.Vector3(4.8, -2.8, 2), // Aquatics center point
    element: document.querySelector(".point-0"),
  },
  {
    position: new THREE.Vector3(5.1, -3.6, 7.6), // ILC point
    element: document.querySelector(".point-1"),
  },
  {
    position: new THREE.Vector3(1.3, -3.4, 7.8), // PAC point
    element: document.querySelector(".point-2"),
  },
];

/**
 * Section of the code used to locating the vector info points position for the info points
 * /
//by using a cube and placing it in the VECTOR3 location of where you want the points
you can console.log() the location of the cube, by using that location, place it in the
vector values of the interest points. 

// const cubegeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
// const cubematerial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(cubegeometry, cubematerial);
// cube.position.set(0, 0, 0);

// gui
// .add(cube.position, "x")
// .max(10)
// .min(-10)
// .step(0.001)
// .name("Test X");
// gui
// .add(cube.position, "y")
// .max(10)
// .min(-10)
// .step(0.001)
// .name("Test Y");
// gui
// .add(cube.position, "z")
// .max(10)
// .min(-10)
// .step(0.001)
// .name("Test Z");

//console.log(cube.position);

// scene.add(cube)

/**
 * Directional light to act as the "sun" & provide shadows
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(4056, 4056);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

//adding the tweaks in the controls panel for the directionalLight
TechnicalGUI
  .add(directionalLight, "intensity")
  .min(0)
  .max(50)
  .step(0.001)
  .name("Sun Intensity");
  TechnicalGUI
  .add(directionalLight.position, "x")
  .min(-5)
  .max(10)
  .step(0.001)
  .name("Sun X");
  TechnicalGUI
  .add(directionalLight.position, "y")
  .min(-5)
  .max(10)
  .step(0.001)
  .name("Sun Y");
  TechnicalGUI
  .add(directionalLight.position, "z")
  .min(-5)
  .max(10)
  .step(0.001)
  .name("Sun Z");


/**
 * Window Canvas Sizing
 * To resive the canvas if the window is resized or changed
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  //for device performance and visuals
});


/**
 * Camera
 */

// Initial Camera, 
//this starts of with a set location which is then taken over GreenSock or Orbit controls

const camera = new THREE.PerspectiveCamera(
  80,
  sizes.width / sizes.height,
  0.1,
  100
);

camera.position.set(-0.06, -3.3, 1.35);
scene.add(camera);

//controls panel tweaks for the camera
TechnicalGUI.add(camera.position, "x").min(-5).max(5).step(0.00001).name("Camera X");
TechnicalGUI.add(camera.position, "y").min(-5).max(5).step(0.00001).name("Camera Y");
TechnicalGUI.add(camera.position, "z").min(-5).max(5).step(0.00001).name("Camera Z");


/**
 * Orbit controls (Interactive controls)
 */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.1;
controls.maxDistance = 15;
controls.minDistance = 0.01;
controls.maxPolarAngle = Math.PI / 1.5;
controls.minPolarAngle = Math.PI / 10;
controls.target = new THREE.Vector3( 3.98, -2.76, 4.26);
//control panel (techincal) tweaks for the orbit controls
TechnicalGUI
  .add(controls, "autoRotateSpeed")
  .name("Auto Rotate Speed")
  .max(10)
  .min(0.1)
  .step(0.001);
TechnicalGUI
  .add(controls, "dampingFactor")
  .name("Movement easing level")
  .max(0.5)
  .min(0.1)
  .step(0.001);
// gui.add(controls, 'maxDistance') // for testing purposes
// gui.add(controls, 'minDistance') // for testing purposes
TechnicalGUI
  .add(controls.target, "x")
  .min(-5)
  .max(5)
  .step(0.00001)
  .name("Controls Target X");
  TechnicalGUI
  .add(controls.target, "y")
  .min(-5)
  .max(5)
  .step(0.00001)
  .name("Controls Target Y");
  TechnicalGUI
  .add(controls.target, "z")
  .min(-5)
  .max(5)
  .step(0.00001)
  .name("Controls Target Z");


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true, // reduces jagged edges
});

// real life lighting + encoding + tonemapping
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 3;

//shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//pixel/device settings
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//FOG (For better immersion & hiding out "Boundaries")
var fogcolor = "#033f7f";
const fog = new THREE.Fog(fogcolor, 1, 25);
scene.fog = fog;
renderer.setClearColor(fogcolor);

// Encoding panel - debugging for technical controls panel
TechnicalGUI
  .add(renderer, "toneMapping", {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  })
  .name("Tone/Style");

  TechnicalGUI
  .add(renderer, "toneMappingExposure")
  .min(0)
  .max(10)
  .step(0.001)
  .name("Tone/Style brightness");

//stats performance (For testing performance on multiple devices)
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

let statDOM = document.body.appendChild(stats.dom);
statDOM.classList.add("statspanel")


//GSAP animations (GREENSOCK)
 const gsapObject = {
  //once again the cube solution for the VECTOR3 can be used here
  //or by manually setting the camera and using the controls panel to console.log the position
  
  //GSAP animating camera 
     PACfocusGSAP: function () { // To the PAC
        
      //gsap.to used it makes animation from where the camera already is to the desitination
       
      gsap.to(controls.target, {
            duration: 5,
            x: 2.06,
            y:-2.65,
            z: 8.14
            });
      
        gsap.to(camera.position, {
            duration: 5,
            x: -0.03,
            y:-2.15,
            z: 9.19
            });
       
      },

      AquafocusGSAP: function () {  // To the Aquatics center
        
        gsap.to(controls.target, {
            duration: 5,
            x: 4.8,
            y: -2.8,
            z: 2.3
            });
      
        gsap.to(camera.position, {
            duration: 5,
            x: 4.0,
            y: -2.25, 
            z: 2.8
          
            });
      },

      ILCfocusGSAP: function () { // To the ILC 
        
        gsap.to(controls.target, {
            duration: 5,
            x: 5.7,
            y: -2.7,
            z: 7.5
            });
      
        gsap.to(camera.position, {
            duration: 5,
            x: 4.8,
            y: -1.8,
            z: 6.3
            });
      },

      FullfocusGSAP: function () { // To Macro View of the school
        
        gsap.to(controls.target, {
            duration: 5,
            x: 5.12,
            y: -2.59,
            z: 0.46
            });
      
        gsap.to(camera.position, {
            duration: 5,
            x:-5.08, 
            y: 1.56, 
            z: 0.43
            });
      },

     goTourGSAP: function () { // For a tour of the school
   
        //starts at full school view
        gsap.to(controls.target, {
            duration: 5,
            x: 5.12,
            y: -2.59,
            z: 0.46
            });
      
        gsap.to(camera.position, {
            duration: 5,
            x:-5.08, 
            y: 1.56, 
            z: 0.43
            });

        //Location 1 - for the tour
        gsap.to(controls.target, { duration: 5,
            x: 4.783702814504232, y: -3.0775103706225573, z: 3.7732226061215153,
            delay: 10 });
      
        gsap.to(camera.position, { duration: 5,
            x: -1.2279277257974446, y: -2.852452816554733, z: 2.0289677446309087,
            delay: 10  });
        
            //Location 2 - for the tour
        gsap.to(controls.target, { duration: 3,
            x: 5.036808999282484, y: -3.0514440177482727, z: 5.47275527603404,
            delay: 15 });
      
        gsap.to(camera.position, { duration: 3,
            x: 1.955478536026673, y: 0.044140677598314415, z: 5.236954502714106,
            delay: 15  });
        
            //Location 3 - for the tour
        gsap.to(controls.target, { duration: 3,
            x: 2.984486639161877, y: -3.8104176079106185, z: -2.5252449422492678,
            delay: 20 });
      
        gsap.to(camera.position, { duration: 3,
            x: 0.1639697938110638, y: -3.2699706700381648, z: -7.063118734005729,
            delay: 20  });
        
            //Location 4 - for the tour
        gsap.to(controls.target, { duration: 5,
            x: 2.964996468688137, y: -2.41276037838069, z: 1.1149399052355649,
            delay: 25 });
      
        gsap.to(camera.position, { duration: 5,
            x: 9.491018424315433, y: 0.7761190642912368, z: 0.3317786152275958,
            delay: 25  });

       

       // Ends at full school view - for the tour
       gsap.to(controls.target, {
        duration: 5,
        x: 5.12,
        y: -2.59,
        z: 0.46,
        delay: 30
        });
  
    gsap.to(camera.position, {
        duration: 5,
        x:-5.08, 
        y: 1.56, 
        z: 0.43,
        delay: 30 
        });
      },

      // to give GSAP XYZ Camera values for the target/position of the camera
      gsapCamConsole: function () {
        console.log("Position")
        console.log(camera.position)
        console.log("Target")
        console.log(controls.target)
      },

      statsConsole: function () {
       
        if (statspanelBoolean == false) { // stats panel points toggle
          statspanel.style.visibility = "hidden";
          statspanelBoolean = true;
        } else {
          statspanel.style.visibility = "visible";
          statspanelBoolean = false;
        }

      }
    };


//control panel for the GSAP animations
gui.add(gsapObject, 'PACfocusGSAP').name('Focus to PAC')
gui.add(gsapObject, 'AquafocusGSAP').name('Focus to Aquatics')
gui.add(gsapObject, 'ILCfocusGSAP').name('Focus to ILC')
gui.add(gsapObject, 'FullfocusGSAP').name('Focus to Full School View')
gui.add(gsapObject, 'goTourGSAP').name('Take a tour!')
TechnicalGUI.add(gsapObject, 'gsapCamConsole').name('Camera Values ')


/**
 * Animations - TICK FUNCTION
 */
const tick = () => {
  // Update controls
  controls.update(); // updating the controls panel as things are tweaked
  stats.begin();//starting the stats testing panel

  //info points
  
  // Update points only when the scene is ready (So HTML isn't showing before WebGL
  if (sceneReady) {

    // Go through each intersect points
    for (const point of points) {
     
      // Get 2D screen position on the screen
      const screenPosition = point.position.clone();
      screenPosition.project(camera);

      // Set the raycaster for intersections
      raycaster.setFromCamera(screenPosition, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // If No intersect found
      if (intersects.length === 0) {
        // Show point
        point.element.classList.add("visible");
      }

      // If Intersect found
      else {

        // Get the distance of the intersection & distance of the point
        const intersectionDistance = intersects[0].distance;
        const pointDistance = point.position.distanceTo(camera.position);

        // Intersection is closer than the point location
        if (intersectionDistance < pointDistance) {
          // Hide the interest point
          point.element.classList.remove("visible");
        }
        // Intersection is further than the point location
        else {

          // Show the interest point
          point.element.classList.add("visible");
        }
      }

      // If location on 2D screen moved XZ, XZ values moves interest point by XZ
      const translateX = screenPosition.x * sizes.width * 0.5;
      const translateY = -screenPosition.y * sizes.height * 0.5;
      point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
    }
  }

  // Render  
  renderer.render(scene, camera);

  // Call animation frame update for window per tick funtion for next frame
  window.requestAnimationFrame(tick);

  //ending stats collection here 
  stats.end();
};

//calling tick
tick();