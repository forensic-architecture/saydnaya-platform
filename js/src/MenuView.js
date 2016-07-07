FA.MenuView = function( app ) {

    var $container = $( '.container' ),
        $locationMenu,
        $witnessMenu,
        $currentMenu,
        $menuType = $( '.menu-type' ),

        // auto scrolling
        localMouseY = 0,
        targetScroll = 0,
        currentScroll = 0,

        // wait a 500msecs before deselecting
        timeoutId = null,
        timeoutDuration = 500,

        isMouseDown = false;



    init();


    function init() {

        build();

        onWindowResize();

        addListeners();

        setNavMode( 'location' );

    }


    function build() {

        var data = app.data;

        $locationMenu = getLocationMenu( app.data );
        $witnessMenu = getWitnessMenu( app.data )

    }


    function getLocationMenu( data ) {

        var html = '',
            locations = data.locations,
            location,
            medias,
            $menu = $('<ul class="menu-location"></ul>');

        for ( var i = 0; i < locations.length; i++ ) {
            location = locations[ i ];
            medias = data.mediasByLocation[ location.slug ];
            html +=
            '<li data-location="' + location.slug + '">' +
                '<div class="folder">' + '<span class="icon"></span><span>' + location.name + '</span></div>' +
                '<ul>' +
                    getMediasHtml( medias ) +
                '</ul>' +
            '</li>';
        }

        $menu.append( html );

        return $menu;

        function getMediasHtml( medias ) {
            var html = '',
                media;
            for ( var i = 0; i < medias.length; i++ ) {
                media = medias[ i ];
                html += '<li class="media" data-id="' + media.id + '">' + media.title + '</li>';
            }
            return html;
        }

    }


    function getWitnessMenu( data ) {

        var html = '',
            witnesses = data.witnesses,
            witness,
            medias,
            $menu = $('<ul class="menu-witness"></ul>');

        for ( var i = 0; i < witnesses.length; i++ ) {
            witness = witnesses[ i ];
            medias = data.mediasByWitness[ witness.slug ];
            html +=
            '<li data-witness="' + witness.slug + '">' +
                '<div class="folder">' + '<span class="icon"></span><span>' + witness.name + '</span></div>' +
                '<ul>' +
                    getMediasHtml( medias ) +
                '</ul>' +
            '</li>';
        }

        $menu.append( html );

        return $menu;

        function getMediasHtml( medias ) {
            var html = '',
                media;
            for ( var i = 0; i < medias.length; i++ ) {
                media = medias[ i ];
                html += '<li class="media" data-id="' + media.id + '" data-location="' + media.location + '">' + media.title + '</li>';
            }
            return html;
        }

    }


    function setNavMode( mode ) {

        var $menu;

        if ( mode === 'location' ) {
            $menu = $locationMenu;
        } else if ( mode === 'witness' ) {
            $menu = $witnessMenu;
        }

        if ( $menu === $currentMenu )
            return;

        // swap divs
        if ( $currentMenu ) $currentMenu.detach();
        $currentMenu = $menu;
        $currentMenu.appendTo( $container );

        // update menu dom
        $menuType
            .find( '.selected' ).removeClass( 'selected' ).end()
            .find( '[data-type="' + mode + '"]' ).addClass( 'selected' );

        // reset highlighted folders
        $container.find( '.selected' )
            .removeClass( 'selected' )
            .find( 'ul' ).css( 'height', 0 );

        // reset model active location
        app.setActiveLocation( null );

        // add / remove listeners based on mode
        if ( mode === 'location' ) {
            $container
                .off( 'mouseenter', '.media', onMouseenterMedia )
                .off( 'mouseleave', '.media', onMouseleaveMedia )
                .on( 'mouseenter', '.folder', onMouseenterFolder )
                .on( 'mouseleave', '.folder', onMouseleaveFolder );
        } else if ( mode === 'witness' ) {
            $container
                .off( 'mouseenter', '.folder', onMouseenterFolder )
                .off( 'mouseleave', '.folder', onMouseleaveFolder )
                .on( 'mouseenter', '.media', onMouseenterMedia )
                .on( 'mouseleave', '.media', onMouseleaveMedia );
        }

    }


    function addListeners() {

        $(window)
            .on( 'resize', onWindowResize )
            .on( 'mousedown', onMouseDown )
            .on( 'mouseup', onMouseUp );

        // type switcher
        $( '.menu-type' ).on( 'click', onTypeClick );

        $( '.container' )
            .on( 'click', onClick )
            .on( 'mousemove', onMouseMove );

        app.on( 'overLocationChange', onModelOverLocationChange );
        // app.on( 'activeLocationChange', onModelActiveLocationChange );

    }


    function removeListeners() {

        $(window)
            .off( 'resize', onWindowResize )
            .off( 'mousedown', onMouseDown )
            .off( 'mouseup', onMouseUp );

        $( '.container' )
            .off( 'click', onClick )
            .off( 'mousemove', onMouseMove )
            .off( 'mouseenter', '.folder', onMouseenterFolder )
            .off( 'mouseleave', '.folder', onMouseleaveFolder )
            .off( 'mouseenter', '.media', onMouseenterMedia )
            .off( 'mouseleave', '.media', onMouseleaveMedia );

        app.remove( 'overLocationChange', onModelOverLocationChange );
        // app.remove( 'activeLocationChange', onModelActiveLocationChange );

    }


    function onModelOverLocationChange( e ) {

        var prev = e.prev,
            current = e.location,
            el;

        el = $('.menu-location [data-location="' + current + '"]');
        el.addClass( 'over' );

        el = $('.menu-location [data-location="' + prev + '"]');
        el.removeClass( 'over' );

    }


    // function onModelActiveLocationChange( e ) {
    //
    //
    //
    // }


    function onTypeClick( e ) {

        var $target = $( e.target ),
            navMode = $target.data('type');

        if ( !$target.is( 'span' ) ){
            return;
        }

        navMode = $target.data('type');

        setNavMode( navMode )

    }


    function onClick( e ) {

        var $target = $( e.target );

        if ( $target.hasClass( 'folder' ) || $target.parent().hasClass( 'folder' ) ) {

            // if we clicked the inner span, we need to point to the right element
            $target = ( $target.parent().hasClass( 'folder' ) ) ? $target.parent() : $target;

            // if already selected
            if ( $target.parent().hasClass( 'selected' ) ) {
                // deselect current
                $currentMenu.find( '.selected' )
                    .removeClass( 'selected' )
                    .find( 'ul' ).css( 'height', 0 );

                app.setActiveLocation( null );

            } else {

                // deselect current
                $currentMenu.find( '.selected' )
                    .removeClass( 'selected' )
                    .find( 'ul' ).css( 'height', 0 );

                // select new
                var height = $target.next().prop('scrollHeight');
                $target
                    .next().css( 'height', height ).end()
                    .parent().addClass( 'selected' );

                // change active location
                if ( $currentMenu.hasClass( 'menu-location' ) ) {
                    var slug = $target.parent().data( 'location' );

                    app.setActiveLocation( slug );
                }
            }

        } else if ( $target.hasClass( 'media' ) ) {

            // TODO
            // extract id of video
            // change state (pass video id, and next state type: eg. home or )

            var id = $target.data( 'id' ),
                mediaData = app.data.mediaById[ id ];

                console.log(mediaData);

            app.changeState( new FA.StateVideo2( app, 'home', mediaData ) );

        }

    }


    function onMouseMove( e ) {

        if ( isMouseDown )
            return;

        localMouseY = e.pageY - $container.offset().top;

    }


    function onMouseenterFolder( e ) {

        if ( isMouseDown )
            return;

        clearTimeout( timeoutId );

        var locationSlug = $( e.target ).parent().data( 'location' );

        app.setOverLocation( locationSlug );

    }


    function onMouseleaveFolder( e ) {

        if ( isMouseDown )
            return;

        clearTimeout( timeoutId );
        timeoutId = setTimeout( function(){

            app.setOverLocation( null );

        }, timeoutDuration );

    }


    function onMouseenterMedia( e ) {

        if ( isMouseDown )
            return;

        clearTimeout( timeoutId );

        var locationSlug = $( e.target ).data( 'location' );

        app.setActiveLocation( locationSlug );

    }


    function onMouseleaveMedia( e ) {

        clearTimeout( timeoutId );
        timeoutId = setTimeout( function(){

            app.setActiveLocation( null );

        }, timeoutDuration );

    }


    function onMouseDown( e ) {

        isMouseDown = true;

    }


    function onMouseUp( e ) {

        isMouseDown = false;

    }


    function onWindowResize() {

        var windowHeight = $(window).innerHeight(),
            startY = $container.offset().top,
            height = windowHeight - startY - 40;

        $container.css( 'height', height );

    }


    //        //
    // Public //
    //        //


    this.update = function() {

        var menuHeight = $currentMenu.height(),
            containerHeight = $container.height(),
            overflow = menuHeight - containerHeight,
            pct = ( localMouseY - 40 ) / ( containerHeight - 80 );  // margin of 40px on top and bottom

        pct = Math.min( Math.max( pct, 0 ), 1); // clamp

        if ( overflow > 0 ) {
            targetScroll = pct * overflow;
        } else {
            targetScroll = 0;
        }

        currentScroll += ( targetScroll - currentScroll ) * 0.1;

        $currentMenu.css( 'transform', 'translate3d(0px,-' + currentScroll + 'px,0px)' );

    }


    this.show = function() {

        $('#left-bar').fadeIn(300);

    }


    this.hide = function() {

        $('#left-bar').fadeOut(0);

        localMouseY = 0;

        // close any open folder
        // $currentMenu.find( '.selected' )
        //     .removeClass( 'selected' )
        //     .find('ul').height(0);

    }


    this.destroy = function() {

        removeListeners();

        $( '.container' ).empty();

    }

}
