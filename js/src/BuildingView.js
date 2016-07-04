/*
 * 3D view of the building
 *
 * @buildingMesh [Mesh]
 * @roomMeshes [Mesh Array]
 * @terrainMesh [Mesh]
 */
FA.BuildingView = function( app ) {

    var $dom,

        sceneWidth,
        sceneHeight,

        camera,
        renderer,

        scene,
        roomsGroup,

        directionalLight,

        buildingMesh,
        roofMesh,
        //roomMeshes = [],
        rooms,
        terrainMesh,
        roofEdgeHelper,


        controls,

        raycaster;


    init();


    function init() {

        buildingMesh = app.buildingMesh;
        roofMesh = app.buildingRoofMesh;
        terrainMesh = app.terrainMesh;
        rooms = app.rooms;

        $dom = $('#layer-gl');

        sceneWidth = $dom.width();
        sceneHeight = $dom.height();

        initScene();
        addObjects();
        addControls();

        //
        // listen to model changes
        //

        app.on( 'activeLocationChange', function( e ) {
            var current = e.current;
            for ( var i = 0; i < rooms.length; i++ ) {
                var room = rooms[ i ],
                    roomSlug = room.getSlug();

                if ( room.getSlug() === current ) {
                    room.$label.addClass( 'selected' );
                    room.mark();

                } else {
                    room.$label.removeClass( 'selected' );
                    if ( roomSlug !== app.getOverLocation() ) {
                        room.unmark();
                    }

                }
            }
        } );

        app.on( 'overLocationChange', function( e ) {
            var location = e.location;

            for ( var i = 0; i < rooms.length; i++ ) {
                var room = rooms[ i ],
                    roomSlug = room.getSlug();

                if ( roomSlug === location ) {
                    room.$label.addClass( 'over' );
                    room.mark();

                } else {
                    room.$label.removeClass( 'over' );
                    if ( roomSlug !== app.getActiveLocation() ) {
                        room.unmark();
                    }
                }
            }
        } );


        // TODO: change opacity of model if mouse over left menu
        // opacity returns to the value of the slider after mouse leave

    }


    function initScene() {

        raycaster = new THREE.Raycaster();

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 40, sceneWidth / sceneHeight, 1, 300 );
        camera.position.z = 2;
        camera.position.x = -26;
        camera.position.y = 16;
        camera.position.z = 19;

        // testing view offset
        camera.setViewOffset( sceneWidth + sceneWidth/6, sceneHeight - sceneHeight/6, 0, 0, sceneWidth, sceneHeight );


        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( sceneWidth, sceneHeight );
        renderer.setClearColor( 0x666666 );

        $dom.append( renderer.domElement );

    }


    function addObjects() {

        // lights
        var ambient = new THREE.AmbientLight( 0x333333 );
        scene.add( ambient );

        directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
        directionalLight.position.set( 0, 0, 0.1 );
        scene.add( directionalLight );

        // building
        scene.add( buildingMesh );

        // line helper (building)
        var edgeHelper = new THREE.EdgesHelper( buildingMesh, 0x000000, 80 );
        edgeHelper.material.transparent = true;
        edgeHelper.material.opacity = 0.3;
        edgeHelper.material.linewidth = 1;
        scene.add( edgeHelper );

        // roof
        var materials = roofMesh.material.materials;
        for (var i = 0; i < materials.length; i++) {
            materials[i].transparent = true;
        }
        roofMesh.renderOrder = 1;
        scene.add( roofMesh );

        // line helper (roof)
        roofEdgeHelper = new THREE.EdgesHelper( roofMesh, 0x000000, 20 );
        roofEdgeHelper.material.transparent = true;
        roofEdgeHelper.material.opacity = 0.2;
        roofEdgeHelper.material.linewidth = 1;
        roofEdgeHelper.renderOrder = 1;
        scene.add( roofEdgeHelper );

        // rooms
        roomsGroup = new THREE.Object3D();

        for ( var i = 0; i < rooms.length; i++ ) {
            roomsGroup.add( rooms[ i ].object3D );
        }

        scene.add( roomsGroup );

        // terrain
        scene.add( terrainMesh );

    }


    function addControls() {

        // controls
        controls = new THREE.OrbitControls( camera, $('#layer-labels')[0] );
        //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        //controls.enablePan = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.01;
        controls.maxPolarAngle = 1.1;
        controls.minPolarAngle = 0.7;
        // controls.enableKeys = false;

    }


    //        //
    // Public //
    //        //


    this.render = function() {

        controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true

        directionalLight.position.copy( camera.position );

        renderer.render( scene, camera );

    }


    this.getIntersectingRoom = function( mouse ) {

        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects( roomsGroup.children );

        if ( intersects.length > 0 ) {
            return intersects[ 0 ].object;
        } else {
            return null;
        }

    }


    this.setSize = function( width, height ) {

        sceneWidth = width;
        sceneHeight = height;

        camera.aspect = sceneWidth / sceneHeight;
        camera.updateProjectionMatrix();
        // testing view offset
        camera.setViewOffset( (sceneWidth + sceneWidth/6), (sceneHeight - sceneHeight/6) , 0, 0, sceneWidth, sceneHeight );


        renderer.setSize( sceneWidth, sceneHeight );

    }


    this.setOpacity = function( val ) {

        // building
        var materials = buildingMesh.material.materials;
        for ( var i = 0; i < materials.length; i++ ) {
            materials[ i ].opacity = val;
            materials[ i ].needsUpdate = true;
        }

        // roof
        materials = roofMesh.material.materials;
        for ( var i = 0; i < materials.length; i++ ) {
            materials[ i ].opacity = val * val * 1.1;
            materials[ i ].needsUpdate = true;
        }
        roofEdgeHelper.material.opacity = val * val * 0.2;
        roofEdgeHelper.material.needsUpdate = true;

        // terrain
        materials = terrainMesh.material.materials;
        for ( var i = 0; i < materials.length; i++ ) {
            materials[ i ].opacity = val * val + 0.5;
            materials[ i ].needsUpdate = true;
        }

    }


    this.destroy = function() {

        // dispose controls
        controls.dispose();
        controls = null;

        // remove scene
        $dom.empty();
        renderer = null;

        // TODO remove app.listeners

    }


    this.getDom = function() {

        return $dom;

    }


    this.getCamera = function() {

        return camera;

    }

}
