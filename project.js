var camera, scene, renderer, controls;
var deg = Math.PI / 180;

var objects = [];

var raycaster;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

var video, videoTexture;

//Images
var imgGroup = new THREE.Group;

//Videos 
var cam, video1, video2, video3;


//lights
var spotLight;

//  Maps
var sizeX = 1024;
var sizeY = 1024;
var segX = 200;
var segY = 200;
var texture;
var mapGen;
var mapsGroup = new THREE.Group();
var plate, sphere, cylinder, arc;


function mapGenerator(height, width, elements, sizeMax, sizeOffset) {

    sizeX = width;
    sizeY = height;

    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(0, sizeX, 0, sizeY, 0, 1000);
    this.camera.updateProjectionMatrix();

    this.scene.add(this.camera);

    this.geometry = new THREE.BufferGeometry();

    var maxSize = 0;

    var positions = [];
    var colors = [];
    var centers = [];
    var sizes = [];

    for (var i = 0; i < elements; i++) {
        var size = Math.random() * sizeMax + sizeOffset;
        var x = Math.random() * (sizeX - size);
        var y = Math.random() * (sizeY - size);

        if (size > maxSize) maxSize = size;

        var r = Math.random() * 0.5;
        var g = Math.random() * 0.5;
        var b = Math.random() * 0.5;

        for (var j = 0; j < 6; j++)
            colors.push(r, g, b, 1.0);

        centers.push(x + size / 2.0, y + size / 2.0);
        centers.push(x + size / 2.0, y + size / 2.0);
        centers.push(x + size / 2.0, y + size / 2.0);

        centers.push(x + size / 2.0, y + size / 2.0);
        centers.push(x + size / 2.0, y + size / 2.0);
        centers.push(x + size / 2.0, y + size / 2.0);

        positions.push(x, y, size);
        positions.push(x + size, y, size);
        positions.push(x + size, y + size, size);

        positions.push(x, y, size);
        positions.push(x, y + size, size);
        positions.push(x + size, y + size, size);
    }

    var positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    var colorAttribute = new THREE.Float32BufferAttribute(colors, 4);
    var centerAttribute = new THREE.Float32BufferAttribute(centers, 2);

    this.geometry.addAttribute('position', positionAttribute);
    this.geometry.addAttribute('color', colorAttribute);
    this.geometry.addAttribute('uv', centerAttribute);

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);


    var options = {
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        type: THREE.HalfFloatType,
    };
    this.rtt = new THREE.WebGLRenderTarget(sizeX, sizeY, options);

}

function generateMap(mapGen, renderer) {
    renderer.render(mapGen.scene, mapGen.camera, mapGen.rtt, true);
};


//d3 Data Chart
var image;
var textured3;
var d3geom;
var d3mesh;
var width = 2048;
var height = 2048;
var shift = 10;
var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
};
var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.1);
var y = d3.scaleLinear()
    .rangeRound([height, 0]);
//var svg = d3.select("body").append("svg")
var svg = d3.select("#thesvg").append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill-opacity", "1.0")
    .attr("fill", "white");
var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("fill", "white");

d3.tsv("data.tsv", processRow).then(function (data) {

    // Update scales
    x.domain(data.map(function (d) {
        return d.letter;
    }));
    y.domain([0, d3.max(data, function (d) {
        return d.frequency;
    })]);

    // Draw axes
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .select("path")
        .style("stroke", "none");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).tickFormat(d3.format(".0%")))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("dx", "-1em")
        .attr("dy", "1.66em")
        .style("fill", "#000000")
        .style("font-size", "500%")
        .text("Frequency");

    // Draw bars
    g.append("g")
        .attr("class", "bars")
        .selectAll(".bar").data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return x(d.letter);
        })
        .attr("y", function (d) {
            return y(d.frequency);
        })
        .attr("width", x.bandwidth())
        .attr("height", function (d) {
            return height - y(d.frequency);
        })
        .style("fill", "steelblue");

    // Convert SVG to Canvas
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
    var DOMURL = window.URL || window.webkitURL || window;

    var t0 = performance.now();

    var svgString = domNodeToString(svg.node());

    image = new Image();
    var svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8"
    });
    var url = DOMURL.createObjectURL(svgBlob);

    image.onload = function () {
        var t1 = performance.now();
        console.log("Time  : " + (t1 - t0) + " milliseconds.");
        init(image);
        t1 = performance.now();
        console.log("Time : " + (t1 - t0) + " milliseconds.");
        //animate();

        DOMURL.revokeObjectURL(url);
    }

    image.src = url;
});

function init(image) {

    //////////////
    ////Basic Scene////
    /////////////
    /* #region [blue]  Basic Scene Camera,Floor, Movement Controls etc*/

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    //Renderer Properties
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 750);

    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    controls = new THREE.PointerLockControls(camera);
    //controls.update();
    var blocker = document.getElementById('blocker');
    var instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {

        controls.lock();

    }, true);

    controls.addEventListener('lock', function () {

        instructions.style.display = 'none';
        blocker.style.display = 'none';

    });

    controls.addEventListener('unlock', function () {

        blocker.style.display = 'block';
        instructions.style.display = '';

    });

    scene.add(controls.getObject());

    var onKeyDown = function (event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 32: // space
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;

        }

    };

    var onKeyUp = function (event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

    // floor

    var floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);

    // vertex displacement

    var position = floorGeometry.attributes.position;

    for (var i = 0, l = position.count; i < l; i++) {

        vertex.fromBufferAttribute(position, i);

        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;

        position.setXYZ(i, vertex.x, vertex.y, vertex.z);

    }

    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

    position = floorGeometry.attributes.position;
    var colors = [];

    for (var i = 0, l = position.count; i < l; i++) {

        color.setHSL(Math.random() * 0.7 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        colors.push(color.r, color.g, color.b);

    }

    floorGeometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    var floorMaterial = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors
    });

    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);
    /* #endregion */

    // SPOTLIGHT
    spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 100, 0);
    scene.add(spotLight);
    //////////////
    ////SkyBox////
    /////////////
    var envMap;
    /* #region [skyblue]  SkyBox */

    var urls = ['stormydays_ft.jpg', 'stormydays_bk.jpg', 'stormydays_up.jpg', 'stormydays_dn.jpg', 'stormydays_rt.jpg', 'stormydays_lf.jpg'];
    var loader = new THREE.CubeTextureLoader().setPath('textures/skybox/');
    loader.load(urls, function (texture) {

        var pmremGenerator = new THREE.PMREMGenerator(texture);
        pmremGenerator.update(renderer);

        var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
        pmremCubeUVPacker.update(renderer);

        envMap = pmremCubeUVPacker.CubeUVRenderTarget.texture;

        pmremGenerator.dispose();
        pmremCubeUVPacker.dispose();

        scene.background = texture;

    });

    /* #endregion */

    // model loader
    var loader = new THREE.GLTFLoader().setPath('models/myroom/');
    loader.load('room.gltf', function (gltf) {

        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.material.envMap = envMap;
            }
        });
        gltf.scene.scale.set(2, 2, 2);
        gltf.scene.position.set(0, 4, -100);
        //gltf.scene.rotation.y= 30* deg;
        scene.add(gltf.scene);
    });

    // objects
    //////////////
    ////Webcam////
    /////////////
    /* #region [indianred]   */

    webcam = document.getElementById('webcam');
    var texture = new THREE.VideoTexture(webcam);
    var geometry = new THREE.PlaneBufferGeometry(16, 9);
    geometry.scale(0.5, 0.5, 0.5);
    var material = new THREE.MeshBasicMaterial({
        map: texture
    });
    cam = new THREE.Mesh(geometry, material);
    cam.position.set(-34.02, 10.49, -99.77);
    cam.scale.set(1.1, 1.04, 1);
    scene.add(cam);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

        var constraints = {
            video: {
                width: 1280,
                height: 720,
                facingMode: 'user'
            }
        };

        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {

            // apply the stream to the video element used in the texture

            webcam.srcObject = stream;
            webcam.play();

        }).catch(function (error) {

            console.error('Unable to access the camera/webcam.', error);

        });

    } else {

        console.error('MediaDevices interface not available.');

    }
    /* #endregion */

    //////////////
    ////Video////
    /////////////
    /* #region [purple] */
    function createVideo(src, w, h, pos, rot) {
        ///////////
        // VIDEO //
        ///////////
        // VIDEO AND THE ASSOCIATED TEXTURE
        // create the video element
        video = document.createElement('video');
        video.src = "textures/videos/" + src;
        video.muted = true;
        video.loop = true;
        video.load(); // must call after setting/changing source
        video.play();

        videoImage = document.createElement('canvas');
        videoImage.width = 480;
        videoImage.height = 204;

        videoImageContext = videoImage.getContext('2d');
        // background color if no video present
        videoImageContext.fillStyle = '#000000';
        videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

        videoTexture = new THREE.Texture(videoImage);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;


        var movieMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.DoubleSide
        });

        var movieMaterial2 = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.DoubleSide
        });
        // the geometry on which the movie will be displayed;
        // 		movie image will be scaled to fit these dimensions.
        var movieGeometry = new THREE.PlaneGeometry(w, h, 4, 4);
        var movieScreen = new THREE.Mesh(movieGeometry, movieMaterial);
        console.log(pos)
        console.log(movieScreen.position);
        movieScreen.position.x = pos.x;
        movieScreen.position.y = pos.y;
        movieScreen.position.z = pos.z;

        movieScreen.rotation.x = rot.x * deg;
        movieScreen.rotation.y = rot.y * deg;
        movieScreen.rotation.z = rot.z * deg;

        console.log(movieScreen.position);
        return movieScreen;
    }
    /* #endregion */

    video1 = createVideo("1.ogv", 20, 10, new THREE.Vector3(-10, 10, 0), new THREE.Vector3(0, 0, 0));
    video1.position.set(0.17, 9.79, -100.41);
    video1.scale.set(0.2, 0.19, 1);
    scene.add(video1);

    video2 = video1.clone();
    video2.position.set(5.08, 9.79, -100.41);
    scene.add(video2);

    video3 = video1.clone();
    video3.position.set(-4.74, 9.79, -100.41);
    scene.add(video3);

    //////////////
    ////Images////
    /////////////
    /* #region [green] Images Section */
    function createImage(src, w, h, pos, rot) {
        var imageTexture = THREE.ImageUtils.loadTexture("textures/images/" + src);
        material = new THREE.MeshLambertMaterial({
            map: imageTexture
        });
        plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
        plane.material.side = THREE.DoubleSide;
        plane.position.x = pos.x;
        plane.position.y = pos.y;
        plane.position.z = pos.z;

        plane.rotation.x = rot.x * deg;
        plane.rotation.y = rot.y * deg;
        plane.rotation.z = rot.z * deg;
        imgGroup.add(plane);
    }
    createImage("1.jpg", "8", "10", new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 0, 0));
    createImage("2.jpg", "8", "13", new THREE.Vector3(0, 10, 2), new THREE.Vector3(0, 0, 0));
    createImage("3.jpg", "7", "10", new THREE.Vector3(0, 10, 3), new THREE.Vector3(0, 0, 0));
    createImage("4.jpg", "30", "10", new THREE.Vector3(0, 10, 4), new THREE.Vector3(0, 0, 0));
    createImage("5.jpg", "10", "10", new THREE.Vector3(0, 10, 5), new THREE.Vector3(0, 0, 0));

    imgGroup.position.set(-16, 5, -100);
    imgGroup.scale.set(0.5, 0.5, 1);
    scene.add(imgGroup);
    imgGroup.children[0].position.set(-10.61, 3.51, 1.16);
    imgGroup.children[0].rotation.set(0, 0.5, 0);
    imgGroup.children[1].position.set(8.89, 4.910, -2.82);
    imgGroup.children[1].rotation.set(0, -0.22, 0);
    imgGroup.children[2].position.set(-17.74, 13.68, -0.25);
    imgGroup.children[2].rotation.set(0, 1.58, 0);
    imgGroup.children[3].position.set(-1.6, 13, -6.87);
    imgGroup.children[4].position.set(0, 3.36, 1.4);

    /* #endregion */

    //////////////
    ////Maps////
    /////////////
    /* #region [lightyellow] Maps Section */
    mapGen = new mapGenerator(sizeX, sizeY, 100, 300, 50);
    generateMap(mapGen, renderer)

    var textureLoader = new THREE.TextureLoader();

    texture = textureLoader.load('https://api.mapbox.com/v4/mapbox.streets/4.3894,45.438,14.5/1024x1024.png?access_token=ENTER_YOUR_ACCESS_TOKEN_HERE',
        function (tex) {
            var geometry = new THREE.PlaneGeometry(1, sizeY / sizeX, segX, segY);
            var material = new THREE.MeshBasicMaterial({
                map: tex,
                side: THREE.DoubleSide
            });
            plate = new THREE.Mesh(geometry, material);
            plate.rotation.x = -Math.PI / 2.0;
            plate.rotation.z = -Math.PI / 2.0;
            plate.position.y -= 0.4;
            plate.position.x -= 0.5
            plate.receiveShadow = false;
            plate.castShadow = false;
            mapsGroup.add(plate);

            var geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            var box = new THREE.Mesh(geometry, material);
            box.position.y += 0.15;
            box.position.x -= 0.7;
            box.position.z += 0.1
            mapsGroup.add(box);


            var geometry = new THREE.SphereGeometry(0.3, 0.3, 0.3);
            var sphere = new THREE.Mesh(geometry, material);
            sphere.position.y += 0;
            sphere.position.x += 0.7;
            sphere.position.z += 0.1
            mapsGroup.add(sphere);

            var geometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 20, 5, true);
            var material = new THREE.MeshBasicMaterial({
                map: tex,
                side: THREE.DoubleSide
            });
            var cylinder = new THREE.Mesh(geometry, material);
            cylinder.rotation.z += 90 * (3.14 / 180)
            cylinder.rotation.x += 90 * (3.14 / 180);
            cylinder.position.y += 0.3;
            cylinder.position.z -= 0.35;

            mapsGroup.add(cylinder);

            var geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 25, 5, true, 2.2, 1.8);
            var material = new THREE.MeshBasicMaterial({
                map: tex,
                side: THREE.DoubleSide
            });
            var arc = new THREE.Mesh(geometry, material);
            arc.rotation.z += 0;
            arc.position.y -= 0.2;
            arc.position.z += 1;
            arc.position.x += 0.5;

            mapsGroup.add(arc);


        });
    scene.add(mapsGroup);
    mapsGroup.position.set(17, 7.64, -100);
    mapsGroup.scale.set(8, 8, 8);

    /* #endregion */

    //////////////
    ////D3 Data////
    /////////////
    textured3 = new THREE.Texture(image);
    textured3.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({
        map: textured3,
        side: THREE.DoubleSide
    });
    d3geom = new THREE.BoxGeometry(300, 300, 300);
    d3mesh = new THREE.Mesh(geometry, material);
    scene.add(d3mesh);
    d3mesh.position.set(33, 10, -100);


    //Event Listeners
    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    /* #region [red]  Controls */
    if (controls.isLocked) {

        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects(objects);

        var onObject = intersections.length > 0;

        var time = performance.now();
        var delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 4.8 * 200.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        if (onObject === true) {

            velocity.y = Math.max(0, velocity.y);
            canJump = true;

        }

        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        if (controls.getObject().position.y < 10) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;

        }

        prevTime = time;

    }
    /* #endregion */
    render();
}

function render() {
    videoTexture.needsUpdate = true;
    videoImageContext.drawImage(video, 0, 0);
    renderer.render(scene, camera);
}

function processRow(d) {
    d.frequency = +d.frequency;
    return d;
}

// Get the string representation of a DOM node (removes the node)
function domNodeToString(domNode) {
    var element = document.createElement("div");
    element.appendChild(domNode);
    return element.innerHTML;
}

animate();
