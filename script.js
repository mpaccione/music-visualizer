function init(){
	renderer.setSize(WIDTH,HEIGHT);
	renderer.setClearColor(0x000000);
	renderer.shadowMapEnabaled = true;
	canvas.appendChild(renderer.domElement);
	camera.position.set(POS_X,POS_Y, POS_Z);
	camera.lookAt(new THREE.Vector3(0,0,0));
	camera.name = "camera";
	camera.position.z += 8000;
	scene.add(camera);
	glow.wrapT = THREE.RepeatWrapping;
	glow.wrapS = THREE.RepeatWrapping;
	octree = new THREE.Octree({
	    radius: 1, // optional, default = 1, octree will grow and shrink as needed
	    undeferred: false, // optional, default = false, octree will defer insertion until you call octree.update();
	    depthMax: Infinity, // optional, default = Infinity, infinite depth
	    objectsThreshold: 8, // optional, default = 8
	    overlapPct: 0.15 // optional, default = 0.15 (15%), this helps sort objects that overlap nodes
	});
	
	effectPass = new THREE.ShaderPass(THREE.CopyShader);
	bloomPass = new THREE.BloomPass(1.8);
	renderPass = new THREE.RenderPass( scene, camera );

	composer = new THREE.EffectComposer(renderer);

	composer.addPass(renderPass);
	composer.addPass(bloomPass);
	composer.addPass(effectPass);
	
	effectPass.renderToScreen = true;
	renderer.autoClear = false;

	if (vr) {
		stereo = new THREE.StereoEffect(renderer);
		stereo.setSize( window.innerWidth, window.innerHeight );
	}
}

function shaderInit(){
	//color: 0x4B0082

	uniforms = {
		amplitude: { value: 1.0 },
		ambient: { value: health },
		color:     { value: new THREE.Color( 0x4B0082 ) },
		glowTexture: { value: loader.load( "glow.png ") },
		fogColor: { type: "c", value: scene.fog.color },
		fogNear: { type: "1f", value: scene.fog.near },
		fogFar: { type: "1f", value: scene.fog.far }
	};

	for (var i = displacement.length - 1; i >= 0; i--) {
		noise[i] = Math.random() * 5;
	}

	blockGeom.addAttribute('displacement', new THREE.BufferAttribute( displacement, 1) );

	blockMat = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: THREE.displacementShader.vertexShader,
    	fragmentShader: THREE.displacementShader.fragmentShader,
    	fog: true
	});

	glowMat = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: THREE.glowShader.vertexShader,
    	fragmentShader: THREE.glowShader.fragmentShader,
    	fog: true
	})
}

function audioLink(){
	source.connect(analyser);
	analyser.connect(context.destination);
	analyser.fftSize = 128;
	frequencyData = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteTimeDomainData(frequencyData);		
}

function addSkybox(){
	var materialArray = [],
        imgArray = ["skybox_right.jpg", "skybox_left.jpg",
        "skybox_front.jpg", "skybox_back.jpg",
        "skybox_bottom.jpg", "skybox_top.jpg"];

    for (var i = 0; i < 6; i++){
        materialArray.push( new THREE.MeshBasicMaterial({
            map: loader.load( imgArray[i] ),
            side: THREE.BackSide,
            fog: false
        }));
    }

    var skyMat = new THREE.MeshFaceMaterial( materialArray ),
        skyGeo = new THREE.BoxGeometry( 100000, 100000, 100000, 1, 1, 1),
        sky = new THREE.Mesh(skyGeo, skyMat);

    sky.name = "skybox";
    scene.add(sky);
    skybox = scene.getObjectByName("skybox");
}

function addLight(){
	var whiteAmbient = new THREE.AmbientLight(0xffffff, 1.0),
		redAmbient = new THREE.AmbientLight(0xff0000, 0.0);

	whiteAmbient.name = "whiteAmbient";
	redAmbient.name = "redAmbient";
	scene.add(whiteAmbient);
	scene.add(redAmbient);
}

function addFog(){
	scene.fog = new THREE.Fog(0x000000, 100, 38000);
}

function addTunnel(){
	var cylTexture = loader.load("wormhole2.png"),
		cylGeom = new THREE.CylinderBufferGeometry(5000, 5000, 50000, 32, 1, true),
		cylMat = new THREE.MeshPhongMaterial({
			map: cylTexture,
			side: THREE.BackSide,
			transparent: true
		}),
		cyl = new THREE.Mesh(cylGeom, cylMat);

	cylTexture.wrapT = THREE.RepeatWrapping;
    cylTexture.wrapS = THREE.RepeatWrapping;
	cyl.name = "tunnel";
	scene.add(cyl);
	scene.getObjectByName("tunnel").position.z = -12000;
	rotateObject(scene.getObjectByName("tunnel"), -90, 0, 0);
	octree.add(scene.getObjectByName("tunnel"));
	tunnel = scene.getObjectByName("tunnel");
}

function addTunnelCap(){
	var tunnelGeo = new THREE.CylinderBufferGeometry(5000, 5000, 100, 32, 1, false),
		tunnelMat = new THREE.MeshBasicMaterial({
			color: 0x000000, 
			transparent: true 
		});

	tunnelCap = new THREE.Mesh( tunnelGeo, tunnelMat );
	tunnelCap.name = "tunnelCap";
	scene.add( tunnelCap );
	tunnelCap.position.z = -33000;
	rotateObject(scene.getObjectByName("tunnelCap"), -90, 0, 0);
	tunnelCap = scene.getObjectByName("tunnelCap");
}

function addSettingListeners(){

	document.addEventListener("keypress", function(e){
		if (e.keyCode == 112) {
			paused = paused ? false : true;

			if (paused) {
				clearInterval(blockInterval);
				clearInterval(lightInterval);
				player.pause();
			} else {
				blockTimer(200);
				lightTimer(1000);
				player.play();
			}
		}
	});
	
}

function addControlListeners(){

	camera = scene.getObjectByName("camera");

	document.addEventListener("keydown", function(e){
		if (!stunned) {
			var x = parseFloat(camera.position.x),
				y = parseFloat(camera.position.y),
				z = parseFloat(camera.position.z);
			// left
	  		if (e.keyCode == 37) { x -= 400; }
	  		// up
	  		if (e.keyCode == 38) { y += 400; }
	  		// right
	  		if (e.keyCode == 39) { x += 400; }
	  		// down
	  		if (e.keyCode == 40) { y -= 400; }

	  		tween = new TWEEN.Tween(camera.position)
	                    .to({ x: x, y: y, z: z }, 100)
	                    .onUpdate(function() { 
	                        camera.position.set(this.x, this.y, this.z);
	                        camera.lookAt(new THREE.Vector3(-x*0.025,-y*0.025,0));
	                    })
	                    .start();
	    }
	 
	});
}

function addBlock(){

	num++,
	glowNum = "G" + num,
	block = new THREE.Mesh(blockGeom, blockMat),
	glowMesh = new THREE.Mesh(glowGeom, glowMat);

	var xPos = Math.random() * (-2500 - 2500) + 2500,
		yPos = Math.random() * (-2500 - 2500) + 2500;

	block.position.z = -28000;
	glowMesh.position.z = -28000;
	block.position.x = xPos;
	block.position.y = yPos;
	glowMesh.position.x = xPos;
	glowMesh.position.y = yPos;
	block.name = num;
	glowMesh.name = glowNum,
	scene.add(block);
	scene.add(glowMesh);
	octree.add(scene.getObjectByName(glowNum));
	octree.add(scene.getObjectByName(num));
	blockArray.push(scene.getObjectByName(num));
	glowArray.push(scene.getObjectByName(glowNum));
}

function updateObjects(speed, f){
	if (blockArray.length > 0) {

		for (var i = blockArray.length - 1; i >= 0; i--) {

			if (blockArray[i].position.z > 9000) {
				octree.remove(glowArray[i]);
				scene.remove(blockArray[i]);
				scene.remove(glowArray[i]);
				blockArray.splice(i, 1);
				glowArray.splice(i, 1);
				blockXPosArray.splice(i, 1);
				blockYPosArray.splice(i, 1);
			} else {

				var b = blockArray[i],
					g = glowArray[i];

				b.scale.set(f, f, f);
				b.position.z += speed;
				b.rotation.z += 0.1;

				g.scale.set(f, f, f);
				g.position.z += speed;
				g.rotation.z += 0.1;
			}

		}

	}

	if (lightArray.length > 0) {

		if (lightCollision) {
			var index = lightCollisionIndex;
			octree.remove(lightArray[index]);
            scene.remove(lightArray[index]);
            lightArray.splice(index, 1);
		}

		for (var i = lightArray.length - 1; i >= 0; i--) {

			if (lightArray[i].position.z > 9000) {
				octree.remove(lightArray[i]);
				scene.remove(lightArray[i]);
				lightArray.splice(i, 1);
			} else {
				lightArray[i].position.z += (speed*0.5);
			}

		}

		lightCollision = false;
	}

}

function blockTimer(time){
	blockInterval = setInterval(addBlock, time);
}

function render() {
    
	if (!paused) {
		analyser.getByteFrequencyData(frequencyData);
		frequencyAvg = (frequencyData[12] + frequencyData[24] + frequencyData[36] + frequencyData[48] + frequencyData[60]) * 0.25;
    	displacementUpdate();
	    updateObjects(frequencyAvg*3.5, frequencyAvg*0.01);
	    TWEEN.update();
	    if (!gameOver) {
	    	octree.update();
		    octree.rebuild();
		    colCheck();
	    } else {
	    	scene.getObjectByName("redAmbient").intensity = 1;
	    }
	    skybox.rotation.z -= frequencyAvg*0.0001;
	    tunnel.material.map.offset.y += frequencyAvg*0.0001;
	    tunnel.material.map.offset.x += frequencyAvg*0.00005;
	    tunnel.material.opacity = frequencyAvg*0.01;
	    tunnelCap.material.opacity = frequencyAvg*0.01;
    }

	renderFrame = requestAnimationFrame(render);
	renderer.clear();
	composer.render();
	if (vr) { stereo.render(scene, camera); }
	else { renderer.render(scene, camera); }
	// console.log("Glow "+(frequencyAvg*0.01) * 400);
	// console.log("Block "+(frequencyAvg*0.4) * 300);
};

function startGame(){
	init();
	addLight();
	addFog();
	shaderInit();
	addSkybox();
	addTunnel();
	addTunnelCap();
	addSettingListeners();
	addControlListeners();
	cameraRayCasting();
	render();
	document.getElementById("landing").style.display = "none";
	songLength = (player.duration*1000);
	setTimeout(function(){
		player.play();
		blockTimer(200);
		lightTimer(1000);
	}, 2000);
	setTimeout(function(){
		menu.textContent = "Song Completed!";
		menu.style.display = "block";
		setTimeout(function(){
			document.location.href.reload();
		}, 4000);
	}, songLength);	
	gameStart = true;
};



(function(){

	//VR Controls
	document.getElementById("vrWrap").addEventListener("click", function(){
		vr = true;
		window.addEventListener('deviceorientation', setOrientationControls, true);
		startGame();
	});

	//Song Select
	for (var i = document.getElementsByTagName("tr").length - 1; i >= 0; i--) {
		document.getElementsByTagName("tr")[i].addEventListener("click", function(){

			var file = this.getAttribute("data-file"),
				source = document.getElementById("mp3Source");

			removeSelected();
			this.className = "selected";
			source.src = file;
			player.load();
			audioLink();
			playEnabled();
		});
	}

	//Menu Switch
	document.getElementsByTagName("button")[0].addEventListener("click", function(){
		document.getElementById("songPicker").style.display = "none";
		document.getElementById("laptopWrap").style.display = "inline-block";
		document.getElementById("vrWrap").style.display = "inline-block";
	});

	//Song Upload
	document.getElementById("fileInput").addEventListener('change', function(){
		removeSelected();

		var fileType = this.files[0].type,
			file = this.files[0],
			reader = new FileReader(),
			source = document.getElementById("mp3Source");

			document.getElementsByTagName("h3")[0].textContent = "Loading Song";

		    reader.onload = function(evt){
		    	console.log(evt);
		    	document.getElementsByTagName("h3")[0].textContent = "Song Loaded";
		    	source.src = evt.target.result;
				player.load();
				audioLink();
				playEnabled();
		    };

		    reader.readAsDataURL( file );

	}, false);

})();