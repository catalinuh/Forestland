var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: 

    function BootScene () {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },
    preload: function () {
        // map tiles
        this.load.image('tiles', 'assets/map/spritesheet.png');

        // map in json format
        this.load.tilemapTiledJSON('map', 'assets/map/map.json');

        // enemies
        this.load.image("dragonblue", "assets/dragonblue.png");
        this.load.image("dragonorrange", "assets/dragonorrange.png");

        // our two characters
        this.load.spritesheet('player', 'assets/RPG_assets.png', { 
            frameWidth: 16, 
            frameHeight: 16 
        });

        // music
        // this.load.audio('battleMusic', ['https://opengameart.org/sites/default/files/battle_0.mp3']);
        // this.load.audio('worldMusic', ['https://opengameart.org/sites/default/files/Red%20Curtain.mp3']);
    },
    create: function () {
        this.scene.start('WorldScene');
    }
});

var WorldScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize:

    function WorldScene () {
        Phaser.Scene.call(this, { key: 'WorldScene' });
    },
    preload: function () {
        this.load.audio('world', [
            'assets/audio/RedCurtain.ogg',
            'assets/audio/RedCurtain.mp3'
        ]);
    },
    create: function () {
        // create the map
        var map = this.make.tilemap({ key: 'map' });
        // first parameter is the name of the tilemap in tiled
        var tiles = map.addTilesetImage('spritesheet', 'tiles');

        // createStaticLayer parameters: layerId, tileset, x coorndinate, y coordinate
        var grass = map.createStaticLayer('Grass', tiles, 0, 0);
        var obstacles = map.createStaticLayer('Obstacles', tiles, 0, 0);
        // make all tiles in obstacles collidable
        obstacles.setCollisionByExclusion([-1]);

        var music = this.sound.add('world');
        music.play();
        
        // animation with key 'left', we don't need left and right as we will use one and flip the sprite
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 7, 1, 13] }),
            frameRate: 10,
            repeat: -1
        });
        // animation with key 'right'
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 7, 1, 13] }),
            frameRate: 10,
            repeat: -1
        });
        // animation with key 'up'
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { frames: [2, 8, 2, 14] }),
            frameRate: 10,
            repeat: -1
        });
        // animation with key 'down'
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { frames: [0, 6, 0, 12] }),
            frameRate: 10,
            repeat: -1
        });

        // parameters: x coordinate, y coordinate, image resource, frame
        this.player = this.physics.add.sprite(50, 100, 'player', 6);

        // set world bounds, then set player's property collideWorldBounds to true
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        this.player.setCollideWorldBounds(true);
        
        // adds collision for player and obstacles
        this.physics.add.collider(this.player, obstacles);
        
        // camera stays within map boundaries, third row prevents tiles bleeding (showing border lines on tiles)
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.roundPixels = true; // avoid tile bleed
        
        // reads keyboard input as movement for player
        this.cursors = this.input.keyboard.createCursorKeys();

        this.spawns = this.physics.add.group({ classType: Phaser.GameObjects.Zone });
        for (var i = 0; i < 30; i++) {
            var x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
            var y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);
            // parameters are x, y, width, height
            this.spawns.create(x, y, 20, 20);
        }
        // add collider
        this.physics.add.overlap(this.player, this.spawns, this.onMeetEnemy, false, this);
        // we listen for 'wake' event
        this.sys.events.on('wake', this.wake, this);
    },
    wake: function() {
        this.cursors.left.reset();
        this.cursors.right.reset();
        this.cursors.up.reset();
        this.cursors.down.reset();
    },
    onMeetEnemy: function (player, zone) {
        // we move the zone to some other location
        zone.x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
        zone.y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);

        this.cameras.main.shake(300);
        this.cameras.main.flash(300);
        //this.cameras.main.fade(300);

        this.input.stopPropagation();

        // switch to BattleScene
        this.scene.switch('BattleScene');
    },
    update: function (time, delta) {
        this.player.body.setVelocity(0);

            // horizontal movement
            if (this.cursors.left.isDown) {
                this.player.body.setVelocityX(-80);
            }
            else if (this.cursors.right.isDown) {
                this.player.body.setVelocityX(80);
            }

            // vertical movement
            if (this.cursors.up.isDown) {
                this.player.body.setVelocityY(-80);
            }
            else if (this.cursors.down.isDown) {
                this.player.body.setVelocityY(80);
            }

            // update animation last and give left/right animations precendence over up/down animation
            if (this.cursors.left.isDown) {
                this.player.anims.play('left', true);
                this.player.flipX = true;
            }
            else if (this.cursors.right.isDown) {
                this.player.anims.play('right', true);
                this.player.flipX = false;
            }
            else if (this.cursors.up.isDown) {
                this.player.anims.play('up', true);
            }
            else if (this.cursors.down.isDown) {
                this.player.anims.play('down', true);
            }
            else {
                this.player.anims.stop();
            }
    },
});