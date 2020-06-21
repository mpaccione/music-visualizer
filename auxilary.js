function rotateObject(object,degreeX=0, degreeY=0, degreeZ=0){

   degreeX = (degreeX * Math.PI)/180;
   degreeY = (degreeY * Math.PI)/180;
   degreeZ = (degreeZ * Math.PI)/180;

   object.rotateX(degreeX);
   object.rotateY(degreeY);
   object.rotateZ(degreeZ);

}

function colorData(freq){
	console.log(freq);
    var rgbString = "",
        r = parseInt(freq * 0.13),
        g = 0,
        b = parseInt(((freq * 0.13) - 255) * -1);

    rgbString = "rgb("+r+",0,"+b+")";

    return rgbString;
}

function cameraRayCasting(){
	var cam = scene.getObjectByName("camera");
	cam.rays = [
		  new THREE.Vector3(0, 0, 1),
	      new THREE.Vector3(1, 0, 1),
	      new THREE.Vector3(1, 0, 0),
	      new THREE.Vector3(1, 0, -1),
	      new THREE.Vector3(0, 0, -1),
	      new THREE.Vector3(-1, 0, -1),
	      new THREE.Vector3(-1, 0, 0),
	      new THREE.Vector3(-1, 0, 1)
	];
	cam.caster = new THREE.Raycaster();
}

function colCheck(){
	var collisions, 
		i, 
		distance = 350,
		cam = scene.getObjectByName("camera"),
		octreeResults = octree.search( cam.caster.ray.origin, cam.caster.ray.far, true, cam.caster.ray.direction );
    
    for (i = 0, len = cam.rays.length; i < len; i++) {
		// We reset the raycaster to this direction
		cam.caster.set(cam.position, cam.rays[i]);
		// Test if we intersect with any obstacle mesh
		collisions = cam.caster.intersectOctreeObjects( octreeResults );
		// And disable that direction if we do
		if (collisions.length > 0 && collisions[0].distance <= distance) {
			if (collisions[0].object.name.toString().substring(0,1) == "L" && collisions[0].distance <= 100) {
                lightCollisionIndex = lightArray.indexOf(collisions[0].object);
                lightCollision = true;
                if (health >= 1.0){ health += 0.0025 }
                else if (health > 0.8){ health += 0.005; }
                else if (health > 0.6){ health += 0.01; }
                else if (health > 0.4){ health += 0.05; }
                else if (health > 0.2){ health += 0.1; }
                else { health += 0.2; }
                displayHealthUp();
            } else {
                ambientStrobe();
            }
        }
    }
}

function ambientStrobe(){
	var whiteAmbient = scene.getObjectByName("whiteAmbient"),
		redAmbient = scene.getObjectByName("redAmbient"),
		cam = scene.getObjectByName("camera"),
		rotationX =  Math.random() * (-1 - 1) + 1,
		rotationY = Math.random() * (-1 - 1) + 1, 
		rotationZ = Math.random() * (-1 - 1) + 1;

	stunned = true;
	whiteAmbient.intensity = 0.0;
	redAmbient.intensity = 1.0;

	whiteLightTween = new TWEEN.Tween(whiteAmbient)
                    .to({intensity: whiteAmbient.intensity}, 500)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onUpdate(function() { 
                    })
                    .start();

    redLightTween = new TWEEN.Tween(redAmbient)
                    .to({intensity: 0}, 1000)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onUpdate(function() { 
                    })
                    .start();

    rotationXTween = new TWEEN.Tween(cam.rotation)
                    .to({x: rotationX}, 500)
                    .easing(TWEEN.Easing.Elastic.Out)
                    .onUpdate(function() { 
                    })
                    .start();

    rotationZTween = new TWEEN.Tween(cam.rotation)
                    .to({z: rotationZ}, 500)
                    .easing(TWEEN.Easing.Elastic.Out)
                    .onUpdate(function() { 
                    })
                    .start();

    setTimeout(function(){

        health -= 0.1;
    	displayHealth(500);

    	originalXtween = new TWEEN.Tween(cam.rotation)
                    .to({x: 0}, 500)
                    .easing(TWEEN.Easing.Cubic.In)
                    .onUpdate(function() { 
                    })
                    .start();

        originalZtween = new TWEEN.Tween(cam.rotation)
                    .to({z: 0}, 500)
                    .easing(TWEEN.Easing.Cubic.In)
                    .onUpdate(function() { 
                    })
                    .start();

        setTimeout(function(){
            stunned = false;
        }, 500);
     
    }, 600);

}

function displayHealth(time){
   
    if (health <= 0) { 
    	gameOver = true; 
    	menu.style.display = "block";
    }

	var whiteAmbient = scene.getObjectByName("whiteAmbient");
	
	healthLightTween = new TWEEN.Tween(whiteAmbient)
                    .to({intensity: health}, time)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onUpdate(function() { 
                    })
                    .start();

    if (gameStart) { uniforms.ambient.value = health; }

}

function displayHealthUp(){
    var whiteAmbient = scene.getObjectByName("whiteAmbient");
    
    healthUpLightTween = new TWEEN.Tween(whiteAmbient)
                    .to({intensity: 2.0}, 100)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onUpdate(function() { 
                    })
                    .start();

    setTimeout(function(){ displayHealth(250) }, 250);
}

function addPointLight(){
    var xPos = Math.random() * (-2500 - 2500) + 2500,
        yPos = Math.random() * (-2500 - 2500) + 2500;

    sprite = new THREE.Sprite( spriteMat );
    lightNum++;
    sprite.name = "L"+lightNum;
    sprite.position.z = -28000;
    sprite.position.x = xPos;
    sprite.position.y = yPos;
    sprite.scale.set( 200, 200, 1.0 );
    scene.add( sprite );
    lightArray.push(scene.getObjectByName("L"+lightNum));
    octree.add(scene.getObjectByName("L"+lightNum));
}

function lightTimer(time){
    if (!healthLightsOn) {
        healthLightsOn = true;
        lightInterval = setInterval(addPointLight, time);
    }
}

function displacementUpdate(){
	var time = Date.now() * 0.01;

	uniforms.amplitude.value = frequencyAvg*0.4;
	uniforms.color.value.offsetHSL( 0.0005, 0, 0 );
	for ( var i = 0; i < displacement.length; i ++ ) {
		displacement[ i ] = Math.sin( 0.1 * i + time );;
		noise[ i ] += 0.5 * ( 0.5 - Math.random() );
		noise[ i ] = THREE.Math.clamp( noise[ i ], -5, 5 );
		displacement[ i ] += noise[ i ];
        // console.log(displacement[ i ]);
	}

	for (var i = blockArray.length - 1; i >= 0; i--) {
		blockArray[i].geometry.attributes.displacement.needsUpdate = true;
	}
}
 
function setOrientationControls(e) {
    if (!e.alpha) { return; }

    controls = new THREE.DeviceOrientationControls(camera, true);
    controls.connect();
    controls.update();

    e.addEventListener('click', fullscreen, false);
    window.removeEventListener('deviceorientation', setOrientationControls, true);
}

function playEnabled(){
    document.getElementsByTagName("button")[0].style.opacity = "1";
    document.getElementsByTagName("button")[0].style.cursor = "pointer";
}

function removeSelected(){
    for (var i = document.getElementsByTagName("tr").length - 1; i >= 0; i--) {
        document.getElementsByTagName("tr")[i].className = "";
    }
}